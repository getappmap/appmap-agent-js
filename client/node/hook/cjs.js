/* eslint no-underscore-dangle: off */

const Module = require("module");
const { assert } = require("../check.js");

const global_Reflect_apply = Reflect.apply;

exports.hookCJS = (options, instrumentScript) => {
  let save = Module.prototype._compile;
  Module.prototype._compile = function _compile(content, path) {
    return global_Reflect_apply(save, this, [
      instrumentScript(path, content),
      path,
    ]);
  };
  return () => {
    assert(save !== null, "this cjs hook has already been stopped");
    Module.prototype._compile = save;
    save = null;
  };
};
