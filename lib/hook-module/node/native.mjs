/* globals APPMAP_TRANSFORM_SOURCE:writable */

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
    assert: { assert },
    frontend: { instrument },
    client: { sendClient },
  } = dependencies;
  return {
    unhookNativeModule: (esm) => {
      if (esm) {
        assert(
          typeof APPMAP_TRANSFORM_SOURCE === "function",
          "native modules are not currently hooked",
        );
        APPMAP_TRANSFORM_SOURCE = null;
      }
    },
    hookNativeModule: (client, frontend, { hooks: { esm } }) => {
      if (esm) {
        assert(
          typeof APPMAP_TRANSFORM_SOURCE !== "undefined",
          "the agent was not setup to hook native modules; the node executable should have been given: '--experimental-loader=main/loader.mjs'",
        );
        assert(
          APPMAP_TRANSFORM_SOURCE === null,
          "native modules are already hooked",
        );
        APPMAP_TRANSFORM_SOURCE = (content, context, transformSource) => {
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
        };
      }
      return esm;
    },
  };
};
