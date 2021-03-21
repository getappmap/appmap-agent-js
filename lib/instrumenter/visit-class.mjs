
import Logger from "../logger.mjs";
import * as Dummy from "./dummy.mjs";
import visitKey from "./visit-key.mjs";
import visitClosure from "./visit-closure.mjs";
import visitExpression from "./visit-expression.mjs";

const logger = new Logger(import.meta.url);

const visitClassBody = (node, location) => {
  if (node.type !== "ClassBody") {
    logger.error(`Invalid class body node, got: ${node.type}`);
    return {
      node: Dummy.getClassBodyNode(),
      entities: []
    };
  }
  const pairs = node.body.map((node) => visitMethodDefinition(node, location));
  return {
    node: {
      type: "ClassBody",
      body: pairs.map(getNode)
    },
    entities: pairs.flatMap(getEntities)
  };
};

const visitMethodDefinition = (node, location) => {
  if (node.type !== "MethodDefinition") {
    logger.error(`Invalid method definition node, got: ${node.type}`);
    return {
      node: Dummy.getMethodDefinitionNode(),
      entities: []
    };
  }
  const pair1 = visitKey(node, node.key, node.computed);
  const pair2 = visitClosure(node, node.value, new Context.MethodDefinitionContext(node));
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
};

export default const visitClass = (node, location1, context) => {
  if (node.type !== "ClassExpression" && node.type !== "ClassDeclaration") {
    logger.error(`Invalid class node, got: ${node.type}`);
    return {
      node: Dummy.getClassExpressionNode(),
      entities: []
    };
  }
  const location2 = location1.makeDeeperLocation(node, context);
  if (!location2.shouldBeInstrumented()) {
    return {
      node,
      entities: []
    };
  }
  let pair1;
  if (node.superClass) {
    pair1 = visitExpression(node.superClass, location1, Context.getVoidContext());
  } else {
    pair1 = {
      node: null,
      entities: []
    };
  }
};
