/* eslint no-underscore-dangle: off */

const Module = require("module");

const global_Reflect_apply = Reflect.apply;
const global_undefined = undefined;
const global_Error = Error;

module.exports = (instrumentScript) => {
  const { compile } = Module.prototype;
  Module.prototype._compile = function _compile(content, path) {
    if (new.target !== global_undefined) {
      throw new global_Error("Module.prototype._compile is not a constructor");
    }
    return global_Reflect_apply(compile, this, [
      instrumentScript(content, path),
      path,
    ]);
  };
};
