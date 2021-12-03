const _Map = Map;
const _RegExp = RegExp;

const { from: toArray } = Array;

const cache = new _Map();

export default (dependencies) => {
  const {
    util: { assert, generateGet },
  } = dependencies;

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
      assert(false, "getName called on invalid parent entity");
    }
    assert(false, "getName called on invalid entity");
  };
  const criteria = new _Map([
    ["name", (pattern, { name }, parent) => cache.get(pattern)(name)],
    [
      "qualified-name",
      (pattern, entity, parent) =>
        cache.get(pattern)(getQualifiedName(entity, parent)),
    ],
    [
      "some-label",
      (pattern, { type, labels }, parent) =>
        type !== "function" || labels.some(cache.get(pattern)),
    ],
    [
      "every-label",
      (pattern, { type, labels }, parent) =>
        type !== "function" || labels.every(cache.get(pattern)),
    ],
  ]);
  const criteria_name_array = toArray(criteria.keys());
  return {
    compileExclusion: (exclusion) => {
      for (const name of criteria_name_array) {
        const pattern = exclusion[name];
        if (typeof pattern === "string") {
          if (!cache.has(pattern)) {
            const regexp = new _RegExp(pattern, "u");
            cache.set(pattern, (target) => regexp.test(target));
          }
        }
      }
      return exclusion;
    },
    isExclusionMatched: (exclusion, entity, parent) => {
      const isCriterionSatisfied = (name) => {
        const pattern = exclusion[name];
        if (typeof pattern === "boolean") {
          return pattern;
        }
        if (typeof pattern === "string") {
          return criteria.get(name)(pattern, entity, parent);
        }
        assert(false, "invalid pattern type");
      };
      if (exclusion.combinator === "and") {
        return criteria_name_array.every(isCriterionSatisfied);
      }
      if (exclusion.combinator === "or") {
        return criteria_name_array.some(isCriterionSatisfied);
      }
      assert(false, "invalid exclusion combinator");
    },
    isExcluded: generateGet("excluded"),
    isRecursivelyExclued: generateGet("recursive"),
  };
};
