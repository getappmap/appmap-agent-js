import Minimatch from "minimatch";
import Glob from "glob";

const { makeRe: makeGlobRegExp } = Minimatch;
const { sync: globSync } = Glob;

const accumulateGlob = (paths, glob) => {
  if (glob.startsWith("!")) {
    const regexp = makeGlobRegExp(glob.substring(1));
    return paths.filter((path) => !regexp.test(path));
  } else {
    return [...paths, ...globSync(glob)];
  }
};

export const globAll = (globs) => globs.reduce(accumulateGlob, []);
