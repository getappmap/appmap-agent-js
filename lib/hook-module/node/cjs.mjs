/* eslint no-underscore-dangle: off */

const {apply} = Reflect;

export default = (dependencies) => {
  const {home:{requireFromHome}, frontend:{instrument}, client:{sendClient}} = dependencies;
  return {
    hookCommonModuleAsync: async ({promise, client, frontend, options}) => {
      if (!coalese(options, "hook-cjs", true)) {
        return promise;
      }
      const Module = requireFromHome("module");
      const {prototype} = Module;
      const {_compile:original} = prototype;
      prototype._compile = function _compile(code1, path) {
        const {code:code2, message} = instrument(frontend, "script", path, code1);
        if (message !== null) {
          sendClient(client, message);
        }
        return apply(original, this, [code2, path]);
      };
      try {
        await promise;
      } finally {
        prototype._compile = original
      }
    };
  };
};
