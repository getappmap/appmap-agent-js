/* eslint no-underscore-dangle: off */

const Module = require("module");

const global_Error = Error;
const global_Reflect_apply = Reflect.apply;

let save = null;

exports.start = (instrument) => {
  if (save !== null) {
    throw new global_Error(`cjs modules are already hooked`);
  }
  save = Module.prototype._compile;
  Module.prototype._compile = function _compile(content, path) {
    return global_Reflect_apply(save, this, [
      instrument("script", path, content, null),
      path,
    ]);
  };
};

exports.stop = () => {
  if (save === null) {
    throw new global_Error(`cjs modules are not yet hooked`);
  }
  Module.prototype._compile = save;
  save = null;
};
