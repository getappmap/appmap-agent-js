const {
  Error,
  Map,
  Array: { from: toArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

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
        throw new Error("getName called on invalid parent entity");
      }
    } else {
      throw new Error("getName called on invalid entity");
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

export const isExclusionMatched = (exclusion, entity, parent) => {
  const isCriterionSatisfied = (name) => {
    const pattern = exclusion[name];
    if (typeof pattern === "boolean") {
      return pattern;
    } else if (typeof pattern === "string") {
      return criteria.get(name)(pattern, entity, parent);
    } else {
      throw new Error("invalid pattern type");
    }
  };
  if (exclusion.combinator === "and") {
    return criteria_name_array.every(isCriterionSatisfied);
  } else if (exclusion.combinator === "or") {
    return criteria_name_array.some(isCriterionSatisfied);
  } else {
    throw new Error("invalid exclusion combinator");
  }
};

export const matchExclusionList = (exclusions, entity, parent) => {
  for (const exclusion of exclusions) {
    if (isExclusionMatched(exclusion, entity, parent)) {
      return {
        excluded: exclusion.excluded,
        recursive: exclusion.recursive,
      };
    }
  }
  throw new Error("missing matched exclusion");
};
