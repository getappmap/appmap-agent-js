
import VisitProgram from "./visit-program.mjs";
import VisitStatement from "./visit-statement.mjs";
import VisitExpression from "./visit-expression.mjs";
import VisitPattern from "./visit-pattern.mjs";
import VisitIdentifier from "./visit-identifier.mjs";
import VisitClass from "./visit-class.mjs";
import VisitClosure from "./visit-closure.mjs";

const {isArray:global_Array_isArray} = Array;

export default (dependencies) => {
  const {util:{assert, identity, constant}} = dependencies;
  const returnNull = constant(null);
  const visitors = {
    __proto__: null,
    ... VisitProgram(dependencies),
    ... VisitStatement(dependencies),
    ... VisitExpression(dependencies),
    ... VisitPattern(dependencies),
    ... VisitIdentifier(dependencies),
    ... VisitClass(dependencies),
    ... VisitClosure(dependencies),
  };
  for (const key in visitors) {
    visitors[key] = {
      prelude: returnNull,
      dismantle: returnNull,
      assemble: identity,
      cluster: identity,
      ... visitors[key],
    };
  }
  const visitField = (field, lineage, context) => {
    if (field === null) {
      return [null, []];
    }
    if (global_Array_isArray(field)) {
      let aggregate = [];
      return {
        payload: field.map((field1) => {
          const {payload, entities} = visitField(field1, lineage, context);
          aggregate.push(... entities);
          return payload;
        }),
        entities: aggregate,
      };
    }
    return visitNode(field, lineage, context);
  };
  const visitNode = (node, lineage, context) => {
    lineage = {head:node, tail:lineage};
    assert(node.type in visitors, "invalid node type %o", node.type);
    const { prelude, dismantle, assemble, cluster } = visitors[node.type];
    const caption = prelude(lineage, context);
    if (caption !== null && context.exclude.has(caption.name)) {
      return {node, entities: []};
    }
    const {payload, entities} = visitField(dismantle(node), lineage, context);
    return {
      payload: assemble(node, payload),
      entities: cluster(entities, lineage, context, caption),
    };
  };
  return {
    visit: (node, context) => {
      const {payload, entities} = visitNode(node, null, context);
      return {node:payload, entities};
    },
  };
};
