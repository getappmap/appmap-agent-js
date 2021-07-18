
import Entity from "./entity.mjs";
import VisitProgram from "./visit-program.mjs";
import VisitStatement from "./visit-statement.mjs";
import VisitExpression from "./visit-expression.mjs";
import VisitPattern from "./visit-pattern.mjs";
import VisitIdentifier from "./visit-identifier.mjs";
import VisitClass from "./visit-class.mjs";
import VisitClosure from "./visit-closure.mjs";

const {isArray} = Array;

export default (dependencies) => {
  const {util:{assert, identity, constant}} = dependencies;
  const makeEntity = Entity(dependencies);
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
  const returnNull = constant(null);
  for (const key in visitors) {
    visitors[key] = {
      extract: returnNull,
      dismantle: returnNull,
      assemble: identity,
      sieve: null,
      ... visitors[key],
    };
  }
  const visitField = (field, lineage, context) => {
    if (field === null) {
      return [null, []];
    }
    if (isArray(field)) {
      let aggregate = [];
      return {
        field: field.map((field1) => {
          const {field, outlines} = visitField(field1, lineage, context);
          aggregate.push(... outlines);
          return field;
        }),
        outlines: aggregate,
      };
    }
    return visitNode(field, lineage, context);
  };
  const visitNode = (node, lineage, context) => {
    lineage = {head:node, tail:lineage};
    assert(node.type in visitors, "invalid node type %o", node.type);
    const { extract, dismantle, assemble, sieve } = visitors[node.type];
    let entity = null;
    const info = extract(lineage, context);
    if (info !== null) {
      assert(sieve !== null, "if extract returns non-null, sieve should be provided");
      const {counter, exclude} = context;
      const index = incrementCounter(counter);
      const {name} = info
      entity = makeEntity(index, lineage, info);
      const {caption} = entity;
      const {name} = specific.name === null ? caption : specific;
      if (exclude.has(name)) {
        return {field:node, outlines:[]};
      }
    }
    let {field, outlines} = visitField(dismantle(node), lineage, context);
    if (sieve !== null) {
      const [outlines1, outlines2] = sieve(outlines);
      outlines = [
        {
          entity,
          children: outlines1
        },
        ... outlines2
      ];
    }
    return {
      field: assemble(node, field, context, entity),
      outlines,
    };
  };
  return {
    visit: (node, context) => {
      const {field, outlines} = visitNode(node, null, context);
      return {node:field, outlines};
    },
  };
};
