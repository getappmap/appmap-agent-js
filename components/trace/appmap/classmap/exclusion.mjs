const {
  Error,
  Map,
  RegExp,
  Array: { from: toArray },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { generateGet } = await import(`../../../util/index.mjs${__search}`);

const cache = new Map();

const getQualifiedName = (entity, parent) => {
  if (entity.type === "class") {
    return entity.name;
  }
  if (entity.type === "function") {
    if (parent === null || parent.type === "function") {
      return entity.name;
    }
    if (parent.type === "class") {
      return `${parent.name}${entity.static ? "#" : "."}${entity.name}`;
    }
    throw new Error("getName called on invalid parent entity");
  }
  throw new Error("getName called on invalid entity");
};

const criteria = new Map([
  ["name", (pattern, { name }, _parent) => cache.get(pattern)(name)],
  [
    "qualified-name",
    (pattern, entity, parent) =>
      cache.get(pattern)(getQualifiedName(entity, parent)),
  ],
  [
    "some-label",
    (pattern, { type, labels }, _parent) =>
      type !== "function" || labels.some(cache.get(pattern)),
  ],
  [
    "every-label",
    (pattern, { type, labels }, _parent) =>
      type !== "function" || labels.every(cache.get(pattern)),
  ],
]);

const criteria_name_array = toArray(criteria.keys());

export const compileExclusion = (exclusion) => {
  for (const name of criteria_name_array) {
    const pattern = exclusion[name];
    if (typeof pattern === "string") {
      if (!cache.has(pattern)) {
        const regexp = new RegExp(pattern, "u");
        cache.set(pattern, (target) => regexp.test(target));
      }
    }
  }
  return exclusion;
};

export const isExclusionMatched = (exclusion, entity, parent) => {
  const isCriterionSatisfied = (name) => {
    const pattern = exclusion[name];
    if (typeof pattern === "boolean") {
      return pattern;
    }
    if (typeof pattern === "string") {
      return criteria.get(name)(pattern, entity, parent);
    }
    throw new Error("invalid pattern type");
  };
  if (exclusion.combinator === "and") {
    return criteria_name_array.every(isCriterionSatisfied);
  }
  if (exclusion.combinator === "or") {
    return criteria_name_array.some(isCriterionSatisfied);
  }
  throw new Error("invalid exclusion combinator");
};

export const isExcluded = generateGet("excluded");

export const isRecursivelyExclued = generateGet("recursive");
