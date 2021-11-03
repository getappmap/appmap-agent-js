/* globals APPMAP_TRANSFORM_MODULE_ASYNC:writable */

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

export default (dependencies) => {
  const {
    util: { assert },
    frontend: { instrument },
    emitter: { sendEmitter },
    "source-outer": { extractSourceMap },
  } = dependencies;
  return {
    unhookNativeModule: (enabled) => {
      if (enabled) {
        assert(
          typeof APPMAP_TRANSFORM_MODULE_ASYNC === "function",
          "native modules are not currently hooked",
        );
        APPMAP_TRANSFORM_MODULE_ASYNC = null;
      }
    },
    hookNativeModule: (emitter, frontend, { hooks: { esm } }) => {
      if (esm) {
        assert(
          typeof APPMAP_TRANSFORM_MODULE_ASYNC !== "undefined",
          "the agent was not setup to hook native modules; the node executable should have been given: '--experimental-loader=main/loader.mjs'",
        );
        assert(
          APPMAP_TRANSFORM_MODULE_ASYNC === null,
          "native modules are already hooked",
        );
        APPMAP_TRANSFORM_MODULE_ASYNC = async (url, content1) => {
          const file = {
            url,
            content: content1,
            type: "module",
          };
          const { content: content2, messages } = instrument(
            frontend,
            file,
            extractSourceMap(file),
          );
          for (const message of messages) {
            sendEmitter(emitter, message);
          }
          return content2;
        };
      }
      return esm;
    },
  };
};
