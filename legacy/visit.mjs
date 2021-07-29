import Outline from "./outline.mjs";
import VisitClass from "./visit-class.mjs";
import VisitExpression from "./visit-expression.mjs";
import VisitFunction from "./visit-function.mjs";
import VisitIdentifier from "./visit-identifier.mjs";
import VisitPattern from "./visit-pattern.mjs";
import VisitProgram from "./visit-program.mjs";
import VisitStatement from "./visit-statement.mjs";

const { isArray } = Array;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { identity, constant, incrementCounter },
  } = dependencies;
  const { makeOutline } = Outline(dependencies);
  const visitors = {
    __proto__: null,
    ...VisitClass(dependencies),
    ...VisitExpression(dependencies),
    ...VisitFunction(dependencies),
    ...VisitIdentifier(dependencies),
    ...VisitPattern(dependencies),
    ...VisitProgram(dependencies),
    ...VisitStatement(dependencies),
  };
  const returnNull = constant(null);
  for (const key in visitors) {
    visitors[key] = {
      extract: returnNull,
      dismantle: returnNull,
      assemble: identity,
      sieve: null,
      ...visitors[key],
    };
  }
  const visitField = (field, lineage, context) => {
    if (field === null) {
      return { field: null, entities: [] };
    }
    if (isArray(field)) {
      let aggregate = [];
      return {
        field: field.map((field1) => {
          const { field, entities } = visitField(field1, lineage, context);
          aggregate.push(...entities);
          return field;
        }),
        entities: aggregate,
      };
    }
    return visitNode(field, lineage, context);
  };
  const visitNode = (node, lineage, context) => {
    lineage = { head: node, tail: lineage };
    assert(node.type in visitors, "invalid node type %o", node.type);
    const { extract, dismantle, assemble, sieve } = visitors[node.type];
    let outline = null;
    const info = extract(lineage, context);
    if (info !== null) {
      assert(
        sieve !== null,
        "if extract returns non-null, sieve should be provided",
      );
      const { counter, exclude } = context;
      const index = incrementCounter(counter);
      outline = makeOutline(index, lineage, info);
      const { caption } = outline;
      const { name } = info.name === null ? caption : info;
      if (exclude.has(name)) {
        return { field: node, entities: [] };
      }
    }
    let { field, entities } = visitField(dismantle(node), lineage, context);
    if (sieve !== null) {
      const [entities1, entities2] = sieve(entities);
      entities = [
        {
          outline,
          children: entities1,
        },
        ...entities2,
      ];
    }
    return {
      field: assemble(node, field, context, outline),
      entities,
    };
  };
  return {
    visit: (node, context) => {
      const { field, entities } = visitNode(node, null, context);
      return { node: field, entities };
    },
  };
};
