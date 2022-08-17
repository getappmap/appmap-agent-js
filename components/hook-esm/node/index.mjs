/* globals APPMAP_ESM_HOOK */

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
    log: { logInfo },
    agent: { instrument },
    interpretation: { runScript },
  } = dependencies;
  const { stringifyContent } = Stringify(dependencies);
  const forward = (arg1, arg2, next) => next(arg1, arg2, next);
  const disable = (hook) => {
    hook.enabled = false;
    hook.transformSource = forward;
    hook.load = forward;
  };
  const enable = (hook, agent) => {
    const transformModule = (url, format, content) =>
      format === "module"
        ? instrument(agent, {
            url,
            type: "module",
            content: stringifyContent(content),
          })
        : content;
    hook.enabled = true;
    hook.transformSource = async (content, context, nextAsync) => {
      const { format, url } = context;
      const { source } = await nextAsync(content, context, nextAsync);
      return {
        source: transformModule(url, format, source),
      };
    };
    hook.load = async (url, context, nextAsync) => {
      const { format, source } = await nextAsync(url, context, nextAsync);
      return {
        format,
        source: transformModule(url, format, source),
      };
    };
  };
  if (typeof APPMAP_ESM_HOOK === "undefined") {
    logInfo(
      "Please, ignore node's deprecated warning about outdated transformSource loader hook (if present).",
    );
    runScript("const APPMAP_ESM_HOOK = {__proto__:null};");
    disable(APPMAP_ESM_HOOK);
  }
  return {
    unhook: (enabled) => {
      assert(
        APPMAP_ESM_HOOK.enabled === enabled,
        "unexpected native modules hooking during unhooking",
      );
      if (enabled) {
        disable(APPMAP_ESM_HOOK);
      }
    },
    hook: (agent, { hooks: { esm: enabled } }) => {
      assert(!APPMAP_ESM_HOOK.enabled, "native modules should not be hooked");
      if (enabled) {
        enable(APPMAP_ESM_HOOK, agent);
      }
      return enabled;
    },
  };
};
