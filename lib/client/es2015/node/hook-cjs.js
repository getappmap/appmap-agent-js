/* eslint no-underscore-dangle: off */

const Module = require("module");

const global_Reflect_apply = Reflect.apply;

module.exports = (instrumentScript) => {
  const compile = Module.prototype._compile;
  Module.prototype._compile = function _compile(content, path) {
    return global_Reflect_apply(compile, this, [
      instrumentScript(content, path),
      path,
    ]);
  };
};
