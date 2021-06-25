import { makeCaption, computeCaption } from "./caption.mjs";
import {
  setVisitor,
  setVisitorWrapper,
  visit,
  getEmptyVisitResult,
} from "./visit.mjs";

setVisitor(
  "MethodDefinition",
  (node, context) => [
    visit(node.key, context, node),
    visit(node.value, context, node),
  ],
  (node, context, [child1, child2]) => ({
    type: (console.log(node), "MethodDefinition"),
    kind: node.kind,
    computed: node.computed,
    static: node.static,
    key: child1,
    value: child2,
  }),
);

setVisitor(
  "ClassBody",
  (node, context) => [node.body.map((child) => visit(child, context, node))],
  (node, context, [children]) => ({
    type: "ClassBody",
    body: children,
  }),
);

{
  const split = (node, context) => [
    node.id === null ? getEmptyVisitResult() : visit(node.id, context, node),
    node.superClass === null
      ? getEmptyVisitResult()
      : visit(node.superClass, context, node),
    visit(node.body, context, node),
  ];
  const join = (node, context, [child1, child2, child3]) => ({
    type: node.type,
    id: child1,
    superClass: child2,
    body: child3,
  });
  setVisitor("ClassExpression", split, join);
  setVisitor("ClassDeclaration", split, join);
}

{
  const isMethodDefinition = ({ caption: { origin } }) =>
    origin === "MethodDefinition";
  const isNotMethodDefinition = ({ caption: { origin } }) =>
    origin !== "MethodDefinition";
  const after = (caption, entities) => {
    const entity = {
      type: "class",
      caption,
      children: entities.filter(isMethodDefinition),
    };
    return [entity, ...entities.filter(isNotMethodDefinition)];
  };
  setVisitorWrapper(
    "ClassDeclaration",
    (node, context) =>
      makeCaption(
        "ClassDeclaration",
        node.id === null ? "default" : node.id.name,
        context.counter.increment(),
      ),
    after,
  );
  setVisitorWrapper(
    "ClassExpression",
    (node, context) => {
      const index = context.counter.increment();
      if (node.id !== null) {
        return makeCaption("ClassExpression", node.id.name, index);
      }
      return computeCaption(node, index);
    },
    after,
  );
}
