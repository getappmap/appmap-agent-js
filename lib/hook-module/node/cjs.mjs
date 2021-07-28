import Module from "module";
const { apply } = Reflect;

const { prototype } = Module;

export default (dependencies) => {
  const {
    state: { instrument },
    client: { sendClient, asyncClientTermination },
  } = dependencies;
  return {
    hookCommonModuleAsync: async (
      client,
      state,
      { hooks: { cjs }, repository: { directory } },
    ) => {
      if (cjs) {
        const { _compile: original } = prototype;
        prototype._compile = function _compile(code1, path) {
          const { code: code2, message } = instrument(
            state,
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
          await asyncClientTermination(client);
        } finally {
          prototype._compile = original;
        }
      }
    },
  };
};
