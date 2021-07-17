import Caption from "./caption.mjs";
import Entity from "./entity.mjs";
import {
  setVisitor,
  setSimpleVisitor,
  visit,
  getEmptyVisitResult,
} from "./visit.mjs";

export default = (dependencies) => {
  const {captionize} = Caption(dependencies);
  const {makeClassEntity} = Entity(dependencies);
  return {
    MethodDefinition: {
      dismantle: ({key,value}) => [key, value],
      assemble: ({kind, computed, static:_static}, [key, value]) => ({
        type: "MethodDefinition",
        kind,
        computed,
        static: _static,
        key,
        value,
      }),
    },
    ClassBody: {
      dismantle: ({body}) => body,
      assemble: ({}, body) => ({
        type: "ClassBody",
        body
      }),
    },

  };
}




const isMethodDefinition = ({ caption: { origin } }) =>
  origin === "MethodDefinition";

const isNotMethodDefinition = ({ caption: { origin } }) =>
  origin !== "MethodDefinition";

const split = (node, context) => [
  node.id === null ? getEmptyVisitResult() : visit(node.id, context, node),
  node.superClass === null
    ? getEmptyVisitResult()
    : visit(node.superClass, context, node),
  visit(node.body, context, node),
];

const join = (node, context, child1, child2, child3) => ({
  type: node.type,
  id: child1,
  superClass: child2,
  body: child3,
});

const after = (node, context, entities) => [
  makeClassEntity(node, entities.filter(isMethodDefinition)),
  ...entities.filter(isNotMethodDefinition),
];

setVisitor(
  "ClassDeclaration",
  (node, context) =>
    makeCaption(
      "ClassDeclaration",
      node.id === null ? "default" : node.id.name,
    ),
  split,
  after,
  join,
);

setVisitor(
  "ClassExpression",
  (node, context) =>
    node.id === null
      ? captionize(node)
      : makeCaption("ClassExpression", node.id.name),
  split,
  after,
  join,
);
