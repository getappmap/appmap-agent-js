import {assert} from "./assert.mjs";

const cache = new Map();

export const getParseRegExp = (pattern, flags) => {
  const key = `/${pattern}/${flags}`;
  let regexp = cache.get(key);
  if (regexp === undefined) {
    regexp = new RegExp(pattern, flags);
    cache.set(key, regexp);
  }
  return regexp;
};

export const getRegExp = (key) => {
  let regexp = cache.get(key);
  if (regexp === undefined) {
    if (key[0] === '/') {
      const index = key.lastIndexOf('/');
      assert(index !== -1, "invalid regexp key: %o", key);
      regexp = new RegExp(key.substring(1, index), key.substring(index + 1));
    } else {
      regexp = {
        test: (match) => match === key
      };
    }
    cache.set(key, regexp);
  }
  return regexp;
};
