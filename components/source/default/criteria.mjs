import { InternalAppmapError } from "../../error/index.mjs";

const {
  RegExp,
  Object: { entries: toEntries },
} = globalThis;

const compileClause = ([name, pattern]) => {
  if (typeof pattern === "boolean") {
    return (_node, _naming) => pattern;
  } else if (typeof pattern === "string") {
    const regexp = new RegExp(pattern, "u");
    const predicate = (string) => regexp.test(string);
    if (name === "name") {
      return (entity, _parent) => predicate(entity.name);
    } else if (name === "qualified-name") {
      return (entity, parent) =>
        predicate(
          entity.type === "closure"
            ? `${parent.name}${entity.static ? "#" : "."}${entity.name}`
            : entity.name,
        );
    } else if (name === "some-label") {
      return (entity, _parent) => entity.labels.some(predicate);
    } else if (name === "every-label") {
      return (entity, _parent) => entity.labels.every(predicate);
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid clause name");
    } /* c8 ignore stop */
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid clause pattern type");
  } /* c8 ignore stop */
};

const compileClauseArray = (combinator, clauses) => {
  const predicates = toEntries(clauses).map(compileClause);
  if (combinator === "and") {
    return (node, naming) =>
      predicates.every((predicate) => predicate(node, naming));
  } else if (combinator === "or") {
    return (node, naming) =>
      predicates.some((predicate) => predicate(node, naming));
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion combinator");
  } /* c8 ignore stop */
};

const compileCriterion = ({ combinator, excluded, recursive, ...clauses }) => {
  const predicate = compileClauseArray(combinator, clauses);
  const spec = { excluded, recursive };
  return (node, naming) => (predicate(node, naming) ? spec : null);
};

export const compileCriteria = (criteria) => {
  const closures = criteria.map(compileCriterion);
  return (node, naming) => {
    for (const closure of closures) {
      const maybe_spec = closure(node, naming);
      if (maybe_spec !== null) {
        return maybe_spec;
      }
    }
    throw new InternalAppmapError("missing matching exclusion criterion");
  };
};
