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
    util: { setBox, getBox },
    frontend: { instrument },
    client: { sendClient },
  } = dependencies;
  return {
    transformSourceDefault: (content, context, transformSource) =>
      transformSource(content, context, transformSource),
    hookNativeModuleAsync: async (
      promise,
      client,
      frontend,
      { hooks: { esm } },
      box,
    ) => {
      if (esm) {
        const original = getBox(box);
        setBox(box, (content, context, transformSource) => {
          const { format, url } = context;
          if (format === "module") {
            const { pathname } = new _URL(url);
            if (typeof content !== "string") {
              content = from(content).toString("utf8");
            }
            const { code, message } = instrument(
              frontend,
              "module",
              pathname,
              content,
            );
            if (message !== null) {
              sendClient(client, message);
            }
            content = code;
          }
          return transformSource(content, context, transformSource);
        });
        try {
          await promise;
        } finally {
          setBox(box, original);
        }
      }
    },
  };
};
