/* eslint no-underscore-dangle: off */

const Module = require("module");
const { strict: Assert } = require("assert");

const global_Reflect_apply = Reflect.apply;

exports.hookCJS = (instrument) => {
  let save = Module.prototype._compile;
  Module.prototype._compile = function _compile(content, path) {
    return global_Reflect_apply(save, this, [
      instrument("script", path, content, null),
      path,
    ]);
  };
  return () => {
    Assert.notEqual(save, null);
    Module.prototype._compile = save;
    save = null;
  };
};
