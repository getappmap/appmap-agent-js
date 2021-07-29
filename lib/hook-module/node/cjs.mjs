import Module from "module";
const { apply } = Reflect;

const { prototype } = Module;

export default (dependencies) => {
  const {
    frontend: { instrument },
    client: { sendClient },
  } = dependencies;
  return {
    hookCommonModuleAsync: async (
      promise,
      client,
      frontend,
      { hooks: { cjs }, repository: { directory } },
    ) => {
      if (cjs) {
        const { _compile: original } = prototype;
        prototype._compile = function _compile(code1, path) {
          const { code: code2, message } = instrument(
            frontend,
            "script",
            path,
            code1,
          );
          if (message !== null) {
            sendClient(client, message);
          }
          return apply(original, this, [code2, path]);
        };
        try {
          await promise;
        } finally {
          prototype._compile = original;
        }
      }
    },
  };
};
