
import makeVisit from "./make-visit.mjs";
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

const visitMethodDefinition = makeVisit("MethodDefinition", {
  __proto__: null,
  MethodDefinition: (node, location) => {
    let pair1;
    if (node.computed) {
      pair1 = visitExpression(node, node.key);
    } else {
      pair1 = visitKey(node, node.key);
    }
    const pair2 = visitFunctionExpression(node, node.value);
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
});

const visitClassBody = makeVisit("ClassBody", {
  __proto__: null,
  ClassBody: (node, location) => {
    const pairs = node.body.map((child) => visitMethodDefinition(child, location));
    return {
      node: {
        type: "ClassBody",
        body: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  }
});

const common = (node, location) => {
  // console.assert(node.type === "ClassExpression" || node.type === "ClassDeclaration");
  let pair1 = empty;
  if (node.id !== null) {
    pair1 = visitName(node.id, location);
  }
  let pair2 = empty;
  if (node.superClass !== null) {
    pair2 = visitExpression(node.superClass, location);
  }
  const pair3 = visitClassBody(node.body, location);
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

export const getClassExpressionVisitor = () => common;

export const getClassDeclarationVisitor = () => common;
