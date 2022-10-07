const {
  Reflect: { ownKeys },
  Array: { isArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert, hasOwnProperty } = await import(
  `../../../../util/index.mjs${__search}`
);
const { getName } = await import(`./naming.mjs${__search}`);

const trimStartString = (string) => string.trimStart();

const extractLineLabel = (line) => {
  assert(line.startsWith("@label "), "invalid label line");
  const maybe_tokens = line.substring("@label".length).match(/\s+\S+/gu);
  return maybe_tokens === null ? [] : maybe_tokens.map(trimStartString);
};

const extractCommentLabelArray = (comment) => {
  const maybe_lines = comment.match(/@label .*/gu);
  return maybe_lines === null ? [] : maybe_lines.flatMap(extractLineLabel);
};

const isMaybeNodeKey = (key) =>
  key !== "type" && key !== "loc" && key !== "start" && key !== "end";

const concatResult = ({ head, body }) =>
  head === null ? body : [head, ...body];

const visitBody = (nodes, parent, grand_parent, name, context) => {
  const head_children = [];
  const body_children = [];
  for (const node of nodes) {
    /* eslint-disable no-use-before-define */
    const { head, body } = visitNode(node, parent, grand_parent, context);
    /* eslint-enable no-use-before-define */
    if (head !== null) {
      head_children.push(head);
    }
    body_children.push(...body);
  }
  return {
    head: {
      type: "class",
      name,
      children: head_children,
    },
    body: body_children,
  };
};

const initial_parent = { type: "File" };
const initial_grand_parent = { type: "Root" };

const visitNode = (node, parent, grand_parent, context) => {
  if (isArray(node)) {
    return {
      head: null,
      body: node.flatMap((child) =>
        concatResult(visitNode(child, parent, grand_parent, context)),
      ),
    };
  }
  if (
    typeof node === "object" &&
    node !== null &&
    hasOwnProperty(node, "type")
  ) {
    const { type } = node;
    if (
      type === "FunctionExpression" ||
      type === "FunctionDeclaration" ||
      type === "ArrowFunctionExpression"
    ) {
      const {
        start,
        end,
        loc: {
          start: { line, column },
        },
      } = node;
      const { naming, getLeadingCommentArray } = context;
      const comments = getLeadingCommentArray(node);
      return {
        head: {
          type: "function",
          name: getName(naming, node, parent),
          children: [
            ...concatResult(visitNode(node.params, node, parent, context)),
            ...concatResult(visitNode(node.body, node, parent, context)),
          ],
          parameters: node.params.map(({ start, end }) => [start, end]),
          static: parent.type === "MethodDefinition" && parent.static,
          range: [start, end],
          line,
          column,
          comments,
          labels: comments.flatMap(extractCommentLabelArray),
        },
        body: [],
      };
    }
    if (
      type === "MethodDefinition" ||
      (type === "Property" && parent.type === "ObjectExpression")
    ) {
      const { head, body } = visitNode(node.value, node, parent, context);
      return {
        head,
        body: [
          ...concatResult(visitNode(node.key, node, parent, context)),
          ...body,
        ],
      };
    }
    if (type === "ObjectExpression") {
      const { naming } = context;
      return visitBody(
        node.properties,
        node,
        parent,
        getName(naming, node, parent),
        context,
      );
    }
    if (type === "ClassBody") {
      const { naming } = context;
      return visitBody(
        node.body,
        node,
        parent,
        getName(naming, parent, grand_parent),
        context,
      );
    }
    return {
      head: null,
      body: ownKeys(node)
        .filter(isMaybeNodeKey)
        .flatMap((key) =>
          concatResult(visitNode(node[key], node, parent, context)),
        ),
    };
  }
  return { head: null, body: [] };
};

export const visit = (node, context) =>
  concatResult(visitNode(node, initial_parent, initial_grand_parent, context));
