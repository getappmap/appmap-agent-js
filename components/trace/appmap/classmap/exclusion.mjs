const {
  URL,
  RegExp,
  Object: { entries: toEntries },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { getEntityName, getEntityQualifiedName, getEntityLabelArray } =
  await import(`./entity.mjs${__search}`);

const compileCriterion = ([name, pattern]) => {
  if (typeof pattern === "boolean") {
    return (_entity, _parent) => pattern;
  } else if (typeof pattern === "string") {
    const regexp = new RegExp(pattern, "u");
    const predicate = (string) => regexp.test(string);
    if (name === "name") {
      return (entity, _maybe_parent_entity) => predicate(getEntityName(entity));
    } else if (name === "qualified-name") {
      return (entity, maybe_parent_entity) =>
        predicate(getEntityQualifiedName(entity, maybe_parent_entity));
    } else if (name === "some-label") {
      return (entity, _maybe_parent_entity) =>
        getEntityLabelArray(entity).some(predicate);
    } else if (name === "every-label") {
      return (entity, _maybe_parent_entity) =>
        getEntityLabelArray(entity).every(predicate);
    } /* c8 ignore start */ else {
      throw new InternalAppmapError("invalid criterion name");
    } /* c8 ignore stop */
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid criterion pattern type");
  } /* c8 ignore stop */
};

const compileCriteria = (combinator, criteria) => {
  const predicates = toEntries(criteria).map(compileCriterion);
  if (combinator === "and") {
    return (entity, maybe_parent_entity) =>
      predicates.every((predicate) => predicate(entity, maybe_parent_entity));
  } else if (combinator === "or") {
    return (entity, maybe_parent_entity) =>
      predicates.some((predicate) => predicate(entity, maybe_parent_entity));
  } /* c8 ignore start */ else {
    throw new InternalAppmapError("invalid exclusion combinator");
  } /* c8 ignore stop */
};

const compileExclusion = ({ combinator, excluded, recursive, ...criteria }) => {
  const predicate = compileCriteria(combinator, criteria);
  const exclusion = { excluded, recursive };
  return (entity, maybe_parent_entity) =>
    predicate(entity, maybe_parent_entity) ? exclusion : null;
};

export const compileExclusionArray = (exclusions) => {
  const closures = exclusions.map(compileExclusion);
  return (entity, maybe_parent_entity) => {
    for (const closure of closures) {
      const maybe_exclusion = closure(entity, maybe_parent_entity);
      if (maybe_exclusion !== null) {
        return maybe_exclusion;
      }
    }
    throw new InternalAppmapError("missing matching exclusion");
  };
};
