const _Map = Map;
const _Set = Set;
const _RegExp = RegExp;

const cache = new _Map();

const regexp =
  /^(\p{ID_Start}\p{ID_Continue}*[#.])?\p{ID_Start}\p{ID_Continue}*$/u;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;
  const getName = (entity, parent) => {
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
  return {
    createExclusion: (inputs) => {
      const names = new _Set();
      const regexps = new _Set();
      for (let input of inputs) {
        if (regexp.test(input)) {
          names.add(input);
        } else {
          if (!cache.has(input)) {
            cache.set(input, new _RegExp(input, "u"));
          }
          regexps.add(cache.get(input));
        }
      }
      return { names, regexps };
    },
    isExcluded: ({ names, regexps }, entity, parent) => {
      const name = getName(entity, parent);
      if (names.has(name)) {
        return true;
      }
      for (const regexp of regexps) {
        if (regexp.test(name)) {
          return true;
        }
      }
      return false;
    },
  };
};
