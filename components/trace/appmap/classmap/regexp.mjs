const { Map, WeakMap, RegExp } = globalThis;

const flags = "u";

const regexps = new Map();

const testers = new WeakMap();

export const makeRegExpCache = (pattern) => {
  if (regexps.has(pattern)) {
    return regexps.get(pattern);
  } else {
    const regexp = new RegExp(pattern, flags);
    regexps.set(pattern, regexp);
    return regexp;
  }
};

const compileTestRegExp = (regexp) => (string) => regexp.test(string);

export const compileTestRegExpCache = (regexp) => {
  if (testers.has(regexp)) {
    return testers.get(regexp);
  } else {
    const test = compileTestRegExp(regexp);
    testers.set(regexp, test);
    return test;
  }
};
