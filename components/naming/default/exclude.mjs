const _Map = Map;
const _Set = Set;
const _RegExp = RegExp;

import Format from "./format.mjs";

const cache = new _Map();

export default (dependencies) => {
  const { isQualifiedName } = Format(dependencies);
  return {
    createExclusion: (inputs) => {
      const names = new _Set();
      const regexps = new _Set();
      for (let input of inputs) {
        if (isQualifiedName(input)) {
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
