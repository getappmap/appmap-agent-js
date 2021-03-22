
import dummify from "./dummify.mjs";
import {getVoidContext, IdentifierContext, MethodDefinitionContext} from "./context.mjs";
import {visitKey} from "./visit-key.mjs";
import {visitName} from "./visit-name.mjs";
import {visitFunctionExpression} from "./visit-closure.mjs";
import {visitExpression} from "./visit-expression.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;
const empty = {
  node: null,
  entities: []
};

const visitClassBody = (node, location) => {
  if (node.type !== "ClassBody") {
    const pairs = node.body.map((node) => visitMethodDefinition(node, location));
    return {
      node: {
        type: "ClassBody",
        body: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  }
  return dummify("ClassBody", node);
};

const visitMethodDefinition = (node, location) => {
  if (node.type !== "MethodDefinition") {
    let pair1;
    if (node.computed) {
      pair1 = visitExpression(node, node.key, getVoidContext());
    } else {
      pair1 = visitKey(node, node.key);
    }
    const pair2 = visitFunctionExpression(node, node.value, new MethodDefinitionContext(node));
    return {
      node: {
        type: "MethodDefinition",
        kind: node.kind,
        computed: node.computed,
        static: node.static,
        key: pair1.key,
        value: pair2.value
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  }
  return dummify("MethodDefinition", node);
};

const visitClass = (node, location, context) => {
  let pair1 = empty;
  if (node.type === "ClassDeclaration" && node.id !== null) {
    pair1 = visitName(node.id, location);
  }
  let pair2 = empty;
  if (node.superClass !== null) {
    pair2 = visitExpression(node.superClass, location, getVoidContext());
  }
  const deeper = location.makeDeeperLocation(node, context);
  let pair3;
  if (deeper.shouldBeInstrumented()) {
    pair3 = visitClassBody(node.body, deeper);
  } else {
    pair3 = {
      node: node.body,
      entities: []
    };
  }
  return {
    node: {
      type: node.type,
      id: pair1.node,
      superClass: pair2.node,
      body: pair3.node
    },
    entities: [...pair1.entities, ...pair3.entities, ...pair3.entities]
  };
}

export const visitClassExpression = (node, location, context) => {
  if (node.type === "ClassExpression") {
    return visitClass(node, location, context)
  }
  return dummify("ClassExpression", node);
};

export const visitClassDeclaration = (node, location) => {
  if (node.type === "ClassDeclaration") {
    let context = getVoidContext();
    if (node.id !== null) {
      context = new IdentifierContext(node.id, "class");
    }
    return visitClass(node, location, context);
  }
  return dummify("ClassDeclaration", node);
};
