/* globals APPMAP_HOOK_EVAL:writable */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_HOOK_EVAL"] */

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

const {String} = globalThis;

export default (dependencies) => {
  const {
    agent: { instrument },
    interpretation: { runScript },
  } = dependencies;
  const forward = (_url, content) => content;
  if (typeof APPMAP_HOOK_EVAL === "undefined") {
    runScript("let APPMAP_HOOK_EVAL = null;");
    APPMAP_HOOK_EVAL = forward;
  }
  return {
    unhook: (enabled) => {
      if (enabled) {
        APPMAP_HOOK_EVAL = forward;
      }
    },
    hook: (agent, { hooks: { eval: whitelist } }) => {
      const enabled = whitelist.length > 0;
      if (enabled) {
        APPMAP_HOOK_EVAL = (url, content) =>
          instrument(agent, {
            url,
            type: "script",
            content: String(content),
          });
      }
      return enabled;
    },
  };
};
