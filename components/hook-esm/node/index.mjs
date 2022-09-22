/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "APPMAP_ESM_HOOK"] */

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

import Stringify from "./stringify.mjs";

export default (dependencies) => {
  const {
    util: { assert },
    agent: { instrument },
    interpretation: { runScript },
  } = dependencies;
  if (typeof APPMAP_ESM_HOOK === "undefined") {
    runScript("let APPMAP_ESM_HOOK = null");
  }
  const { stringifyContent } = Stringify(dependencies);
  return {
    unhook: (enabled) => {
      assert(
        enabled === (APPMAP_ESM_HOOK !== null),
        "unexpected native modules hooking during unhooking",
      );
      if (enabled) {
        APPMAP_ESM_HOOK = null;
      }
    },
    hook: (agent, { hooks: { esm: enabled } }) => {
      assert(APPMAP_ESM_HOOK === null, "native modules are already hooked");
      if (enabled) {
        const transformModule = (url, format, content) =>
          format === "module"
            ? instrument(agent, {
                url,
                type: "module",
                content: stringifyContent(content),
              })
            : content;
        APPMAP_ESM_HOOK = {
          transformSource: async (content, context, nextAsync) => {
            const { format, url } = context;
            const { source } = await nextAsync(content, context, nextAsync);
            return {
              source: transformModule(url, format, source),
            };
          },
          load: async (url, context, nextAsync) => {
            const { format, source } = await nextAsync(url, context, nextAsync);
            return {
              format,
              source: transformModule(url, format, source),
            };
          },
        };
      }
      return enabled;
    },
  };
};
