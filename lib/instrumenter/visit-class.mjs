
import dummify from "./dummify.mjs";
import {getVoidContext, IdentifierContext, MethodDefinitionContext} from "./context.mjs";
import {visitKey} from "./visit-key.mjs";
import {visitFunctionExpression} from "./visit-closure.mjs";
import {visitExpression} from "./visit-expression.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;

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
    const pair1 = visitKey(node, node.key, node.computed);
    const pair2 = visitClosure(node, node.value, new MethodDefinitionContext(node));
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

const visitClass = (node, location1, context) => {
  const location2 = location1.makeDeeperLocation(node, context);
  if (!location2.shouldBeInstrumented()) {
    return {
      node,
      entities: []
    };
  }
  let pair1;
  if (node.superClass) {
    pair1 = visitExpression(node.superClass, location1, getVoidContext());
  } else {
    pair1 = {
      node: null,
      entities: []
    };
  }
  return {
    node: {
      type: node.type,
      superClass: pair1.node,
      body: pair2.node
    },
    entities: [...pair1.entities, ...pair2.entities]
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
