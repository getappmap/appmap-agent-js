/* eslint no-underscore-dangle: off */

import Module from "module";
import { assert } = from "../../../util/index.mjs";

const global_Reflect_apply = Reflect.apply;

let Module_prototype_compile = null;

export const startHooking = ({instrument}) => {
  assert(Module_prototype_compile === null, "cannot start cjs hook");
  Module_prototype_compile = Module.prototype._compile;
  Module.prototype._compile = function _compile(content, path) {
    return global_Reflect_apply(Module_prototype_compile, this, [
      instrument("script", path, content),
      path,
    ]);
  };
};

export const stopHooking = () => {
  if (Module_prototype_compile !== null) {
    Module.prototype._compile = Module_prototype_compile;
  }
};
