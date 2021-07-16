
import VisitProgram from "./visit-program.mjs";
import VisitStatement from "./visit-statements.mjs";
import VisitExpression from "./visit-expression.mjs";
import VisitPattern from "./visit-pattern.mjs";
import VisitIdentifier from "./visit-identifier.mjs";
import VisitClass from "./visit-identifier.mjs";
import VisitClosre from "./visit-closure.mjs";

export default = (components) => {
  const {Util:{assert, incrementCounter}} = components;
  const visitors = {
    __proto__: null,
    ... VisitProgram(components),
    ... VisitStatement(components),
    ... VisitExpression(components),
    ... VisitPattern(components),
    ... VisitIdentifier(components),
    ... VisitClass(components),
    ... VisitClosure(components),
  };
  const visitField = (field, lineage, context) => {
    if (field === null) {
      return [null, []];
    }
    if (Array.isArray(field)) {
      let entities1 = [];
      return [
        field.map((field1) => {
          const [field2, entities2] = visitField(field1, lineage, context);
          entities1.push(... entities2);
          return field2;
        }),
        entities,
      ];
    }
    return visitNode(node, lineage, context);
  };
  const visitNode = (node, lineage, context) => {
    lineage = {head:node, tail:lineage};
    assert(node.type in visitors, "invalid node type %o", node.type);
    const { captionize, split, join, claim } = visitors[node.type];
    const caption = captionize(lineage);
    if (caption !== null && context.exclude.has(caption.name)) {
      return {node, entities: []};
    }
    const index = caption === null ? null : incrementCounter(context.counter);
    const [field, entities] = visitField(split(node), lineage, context);
    return [
      join(node, field),
      claim(entities, lineage, caption, index),
    ];
  };
  return {
    visit: (node, context) => visitNode(node, null, context),
  };
};
