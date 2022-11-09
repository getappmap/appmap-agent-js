const {
  undefined,
  Map,
  Array: { from: toArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert } = await import(`../../../util/index.mjs${__search}`);
const { InternalAppmapError } = await import(
  `../../../error/index.mjs${__search}`
);
const { makeRegExpCache, compileTestRegExpCache } = await import(
  `./regexp.mjs${__search}`
);

const getQualifiedName = (entity, parent) => {
  if (entity.type === "class") {
    return entity.name;
  } else {
    if (entity.type === "function") {
      if (parent === null || parent.type === "function") {
        return entity.name;
      } else if (parent.type === "class") {
        return `${parent.name}${entity.static ? "#" : "."}${entity.name}`;
      } else {
        throw new InternalAppmapError(
          "getName called on invalid parent entity",
        );
      }
    } else {
      throw new InternalAppmapError("getName called on invalid entity");
    }
  }
};

const criteria = new Map([
  ["name", (pattern, { name }, _parent) => makeRegExpCache(pattern).test(name)],
  [
    "qualified-name",
    (pattern, entity, parent) =>
      makeRegExpCache(pattern).test(getQualifiedName(entity, parent)),
  ],
  [
    "some-label",
    (pattern, { type, labels }, _parent) =>
      type !== "function" ||
      labels.some(compileTestRegExpCache(makeRegExpCache(pattern))),
  ],
  [
    "every-label",
    (pattern, { type, labels }, _parent) =>
      type !== "function" ||
      labels.every(compileTestRegExpCache(makeRegExpCache(pattern))),
  ],
]);

const criteria_name_array = toArray(criteria.keys());

// Exported for testing only.
// It may be worthwhile to update tests so we no longer have to export this.
export const isExclusionMatched = (exclusion, entity, parent) => {
  const isCriterionSatisfied = (name) => {
    const pattern = exclusion[name];
    if (typeof pattern === "boolean") {
      return pattern;
    } else if (typeof pattern === "string") {
      return criteria.get(name)(pattern, entity, parent);
    } else {
      throw new InternalAppmapError("invalid pattern type");
    }
  };
  if (exclusion.combinator === "and") {
    return criteria_name_array.every(isCriterionSatisfied);
  } else if (exclusion.combinator === "or") {
    return criteria_name_array.some(isCriterionSatisfied);
  } else {
    throw new InternalAppmapError("invalid exclusion combinator");
  }
};

const excludeEntityRecursively = (entity) => ({
  ...entity,
  excluded: true,
  children: entity.children.map(excludeEntityRecursively),
});

export const excludeEntity = (entity, parent, exclusions) => {
  const maybe_exclusion = exclusions.find((exclusion) =>
    isExclusionMatched(exclusion, entity, parent),
  );
  assert(
    maybe_exclusion !== undefined,
    "missing matching exclusion",
    InternalAppmapError,
  );
  const { excluded, recursive } = maybe_exclusion;
  if (recursive) {
    return excluded ? excludeEntityRecursively(entity) : entity;
  } else {
    return {
      ...entity,
      excluded,
      children: entity.children.map((child) =>
        excludeEntity(child, entity, exclusions),
      ),
    };
  }
};
