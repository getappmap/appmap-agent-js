// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/client/hook/esm.js must be preloaded with --experimental loader");
// }};

const _URL = URL;
const { from } = Buffer;

export default (dependencies) => {
  const {
    util: { setBox },
    state: { instrument },
    client: { sendClient, asyncClientTermination },
  } = dependencies;
  return {
    hookNativeModuleAsync: async (client, state, { hooks: { esm } }, box) => {
      if (esm) {
        setBox(box, (content, context, defaultTransformSource) => {
          const { format, url } = context;
          if (format === "module") {
            const { pathname } = new _URL(url);
            if (typeof content !== "string") {
              content = from(content).toString("utf8");
            }
            const { code, message } = instrument(
              state,
              "module",
              pathname,
              content,
            );
            if (message !== null) {
              sendClient(client, message);
            }
            content = code;
          }
          return defaultTransformSource(
            content,
            context,
            defaultTransformSource,
          );
        });
        try {
          await asyncClientTermination(client);
        } finally {
          setBox(box, null);
        }
      }
    },
  };
};
