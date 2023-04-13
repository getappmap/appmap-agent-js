import Minimatch from "minimatch";
const { Minimatch: MinimatchClass } = Minimatch;

export const compileGlob = (glob) => new MinimatchClass(glob).makeRe();
