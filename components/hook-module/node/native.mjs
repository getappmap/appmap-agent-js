/* globals APPMAP_TRANSFORM_SOURCE_ASYNC:writable */

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

const { from: toBuffer } = Buffer;

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
          typeof APPMAP_TRANSFORM_SOURCE_ASYNC === "function",
          "native modules are not currently hooked",
        );
        APPMAP_TRANSFORM_SOURCE_ASYNC = null;
      }
    },
    hookNativeModule: (emitter, frontend, { hooks: { esm } }) => {
      if (esm) {
        assert(
          typeof APPMAP_TRANSFORM_SOURCE_ASYNC !== "undefined",
          "the agent was not setup to hook native modules; the node executable should have been given: '--experimental-loader=main/loader.mjs'",
        );
        assert(
          APPMAP_TRANSFORM_SOURCE_ASYNC === null,
          "native modules are already hooked",
        );
        APPMAP_TRANSFORM_SOURCE_ASYNC = async (
          content1,
          context,
          transformSourceAsync,
        ) => {
          const { format, url } = context;
          if (format === "module") {
            if (typeof content1 !== "string") {
              content1 = toBuffer(content1).toString("utf8");
            }
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
            content1 = content2;
          }
          return await transformSourceAsync(
            content1,
            context,
            transformSourceAsync,
          );
        };
      }
      return esm;
    },
  };
};
