/* globals APPMAP_HOOK_EVAL:writable */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_HOOK_EVAL"] */

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/emitter/hook/esm.js must be preloaded with --experimental loader");
// }};

const { String, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { instrument } = await import(`../../agent/index.mjs${__search}`);
const { runScript } = await import(`../../interpretation/index.mjs${__search}`);

const forward = (_url, content) => content;

if (typeof APPMAP_HOOK_EVAL === "undefined") {
  runScript("let APPMAP_HOOK_EVAL = null;");
  APPMAP_HOOK_EVAL = forward;
}

export const unhook = (enabled) => {
  if (enabled) {
    APPMAP_HOOK_EVAL = forward;
  }
};

export const hook = (agent, { hooks: { eval: whitelist } }) => {
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
};
