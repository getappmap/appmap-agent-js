const _Map = Map;
const _Set = Set;
const _RegExp = RegExp;

const cache = new _Map();

const regexp =
  /^(\p{ID_Start}\p{ID_Continue}*[#.])?\p{ID_Start}\p{ID_Continue}*$/u;

export default (dependencies) => {
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
    isExcluded: ({ names, regexps }, name) => {
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
