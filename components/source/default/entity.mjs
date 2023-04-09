/* eslint-disable no-use-before-define */

import { InternalAppmapError } from "../../error/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { hasOwnProperty } from "../../util/index.mjs";
import {
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "../../parse/index.mjs";

const {
  Object: { entries: toEntries },
  Array: { isArray },
} = globalThis;

const ANONYMOUS = "[anonymous]";

const DYNAMIC = "[dynamic]";

const getBoundary = ({ start, end }) => ({ start, end });

const getHead = ({ head }) => head;

const getRest = ({ rest }) => rest;

const combine = (results) => ({
  head: results.flatMap(getHead),
  rest: results.flatMap(getRest),
});

const isContainerNodeType = (type) =>
  type === "FunctionExpression" ||
  type === "FunctionDeclaration" ||
  type === "ArrowFunctionExpression" ||
  type === "ClassExpression" ||
  type === "ClassDeclaration" ||
  type === "ObjectExpression";

const getContainerName = (node, name) => {
  if (node.type === "FunctionExpression" || node.type === "ClassExpression") {
    return name === ANONYMOUS && node.id !== null ? node.id.name : name;
  } else if (
    node.type === "FunctionDeclaration" ||
    node.type === "ClassDeclaration"
  ) {
    return node.id === null ? "default" : node.id.name;
  } else if (
    node.type === "ArrowFunctionExpression" ||
    node.type === "ObjectExpression"
  ) {
    return name;
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid container node");
  } /* c8 ignore stop */
};

/////////////
// factory //
/////////////

const createFileEntity = (name, children, node) => ({
  type: "file",
  excluded: false,
  labels: getLeadingCommentArray(node).flatMap(extractCommentLabelArray),
  name,
  children,
});

const createClassEntity = (name, children, node) => ({
  type: "class",
  excluded: false,
  labels: getLeadingCommentArray(node).flatMap(extractCommentLabelArray),
  name,
  children,
});

const createClosureEntity = (name, children, node, is_static) => {
  const comments = getLeadingCommentArray(node);
  return {
    type: "closure",
    excluded: false,
    name,
    children,
    used: false,
    static: is_static,
    comments,
    labels: comments.flatMap(extractCommentLabelArray),
    parameters: node.params.map(getBoundary),
    boundary: getBoundary(node),
    position: { ...node.loc.start }, // cleanup prototype
  };
};

/////////////
// visitor //
/////////////

const visitProgram = (node, name) => {
  if (node.type === "Program") {
    return createFileEntity(
      name,
      node.body.flatMap((child) => visitNode(child, ANONYMOUS)),
      node,
    );
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid program node");
  } /* c8 ignore stop */
};

const visitAny = (any) => {
  if (isArray(any)) {
    return any.flatMap(visitAny);
  } else if (
    typeof any === "object" &&
    any !== null &&
    hasOwnProperty(any, "type") &&
    typeof any.type === "string"
  ) {
    return visitNode(any, ANONYMOUS);
  } else {
    return [];
  }
};

const visitContainerNode = (node, name) => {
  if (
    node.type === "FunctionExpression" ||
    node.type === "FunctionDeclaration" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return {
      head: [
        createClosureEntity(
          getContainerName(node, name),
          [
            ...node.params.flatMap((child) => visitNode(child, ANONYMOUS)),
            ...visitNode(node.body, ANONYMOUS),
          ],
          node,
          false,
        ),
      ],
      rest: [],
    };
  } else if (
    node.type === "ClassExpression" ||
    node.type === "ClassDeclaration"
  ) {
    const { head, rest } = visitClassBody(node.body);
    return {
      head: [createClassEntity(getContainerName(node, name), head, node)],
      rest: [
        ...(node.superClass === null
          ? []
          : visitNode(node.superClass, ANONYMOUS)),
        ...rest,
      ],
    };
  } else if (node.type === "ObjectExpression") {
    const { head, rest } = combine(node.properties.map(visitObjectProperty));
    return {
      head: [createClassEntity(getContainerName(node, name), head, node)],
      rest,
    };
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid container node type");
  } /* c8 ignore stop */
};

const visitEntry = ([key, value]) => {
  if (key === "type" || key === "start" || key === "end" || key === "loc") {
    return [];
  } else {
    return visitAny(value);
  }
};

const visitNode = (node, name) => {
  if (node.type === "AssignmentExpression") {
    return [
      ...visitNode(node.left, ANONYMOUS),
      ...visitNode(
        node.right,
        node.left.type === "Identifier" ? node.left.name : ANONYMOUS,
      ),
    ];
  } else if (node.type === "VariableDeclarator") {
    return [
      ...visitNode(node.id, ANONYMOUS),
      ...(node.init === null
        ? []
        : visitNode(
            node.init,
            node.id.type === "Identifier" ? node.id.name : ANONYMOUS,
          )),
    ];
  } else if (node.type === "ConditionalExpression") {
    return [
      ...visitNode(node.test, ANONYMOUS),
      ...visitNode(node.consequent, name),
      ...visitNode(node.alternate, name),
    ];
  } else if (node.type === "SequenceExpression") {
    const children = node.expressions.slice();
    const last_child = children.pop();
    return [
      ...children.flatMap((child) => visitNode(child, ANONYMOUS)),
      ...visitNode(last_child, name),
    ];
  } else if (node.type === "LogicalExpression") {
    return [...visitNode(node.left, name), ...visitNode(node.right, name)];
  } else if (isContainerNodeType(node.type)) {
    const { head, rest } = visitContainerNode(node, name);
    return [...head, ...rest];
  } else {
    return toEntries(node).flatMap(visitEntry);
  }
};

const visitClassBody = (node) => {
  if (node.type === "ClassBody") {
    return combine(node.body.map(visitClassProperty));
  } /* c8 ignore start */ else {
    logWarning("unrecognized class body node %j", node.type);
    return {
      head: [],
      rest: visitNode(node, ANONYMOUS),
    };
  } /* c8 ignore stop */
};

const visitClassProperty = (node) => {
  if (node.type === "MethodDefinition") {
    return {
      rest: visitNode(node.key, ANONYMOUS),
      head: visitClassMethod(
        node.value,
        !node.computed && node.key.type === "Identifier"
          ? node.key.name
          : DYNAMIC,
        node.static,
      ),
    };
  } else if (node.type === "PropertyDefinition") {
    return combine([
      { head: [], rest: visitNode(node.key, ANONYMOUS) },
      node.value === null
        ? { head: [], rest: [] }
        : visitPropertyValue(
            node.value,
            !node.computed && node.key.type === "Identifier"
              ? node.key.name
              : DYNAMIC,
          ),
    ]);
  } /* c8 ignore start */ else {
    logWarning("unrecognized class property node %j", node.type);
    return {
      head: [],
      rest: visitNode(node, ANONYMOUS),
    };
  } /* c8 ignore stop */
};

const visitClassMethod = (node, name, is_static) => {
  if (node.type === "FunctionExpression") {
    return createClosureEntity(
      name,
      [
        ...node.params.flatMap((child) => visitNode(child, ANONYMOUS)),
        .../* typescript abstract method */
        (hasOwnProperty(node, "body") && node.body !== null
          ? visitNode(node.body, ANONYMOUS)
          : []),
      ],
      node,
      is_static,
    );
  } /* c8 ignore start */ else {
    logWarning("unrecognized class method node %j", node.type);
    return {
      head: [],
      rest: visitNode(node, ANONYMOUS),
    };
  } /* c8 ignore stop */
};

const visitObjectProperty = (node) => {
  if (node.type === "Property") {
    return combine([
      { head: [], rest: visitNode(node.key, ANONYMOUS) },
      visitPropertyValue(
        node.value,
        !node.computed && node.key.type === "Identifier"
          ? node.key.name
          : DYNAMIC,
      ),
    ]);
  } else if (node.type === "SpreadElement") {
    return {
      head: [],
      rest: visitNode(node.argument, ANONYMOUS),
    };
  } /* c8 ignore start */ else {
    logWarning("unrecognized object property node %j", node.type);
    return {
      head: [],
      rest: visitNode(node, ANONYMOUS),
    };
  } /* c8 ignore stop */
};

const visitPropertyValue = (node, name) => {
  if (node.type === "LogicalExpression") {
    return combine([
      visitPropertyValue(node.left, name),
      visitPropertyValue(node.right, name),
    ]);
  } else if (node.type === "ConditionalExpression") {
    return combine([
      { head: [], rest: visitNode(node.test, ANONYMOUS) },
      visitPropertyValue(node.consequent, name),
      visitPropertyValue(node.alternate, name),
    ]);
  } else if (node.type === "SequenceExpression") {
    const children = node.expressions.slice();
    const last_child = children.pop();
    return combine([
      {
        head: [],
        rest: children.flatMap((child) => visitNode(child, ANONYMOUS)),
      },
      visitPropertyValue(last_child, name),
    ]);
  } else if (isContainerNodeType(node.type)) {
    return visitContainerNode(node, name);
  } else {
    return {
      head: [],
      rest: visitNode(node, ANONYMOUS),
    };
  }
};

////////////
// export //
////////////

export const toEntity = visitProgram;
