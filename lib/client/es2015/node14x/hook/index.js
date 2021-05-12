const Path = require("path");

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
const preloaded = Path.join(__dirname, "esm.js") in require.cache;

const HookCJS = require("./cjs.js");
const HookESM = require("./esm.js");

const global_Error = Error;

const prototype = {
  start(instrument) {
    if (this.cjs) {
      HookCJS.start(instrument);
    }
    if (this.esm) {
      HookESM.start(instrument);
    }
  },
  stop() {
    if (this.cjs) {
      HookCJS.stop();
    }
    if (this.esm) {
      HookESM.stop();
    }
  },
};

exports.isHookESMEnabled = () => preloaded;

exports.makeHook = (options) => {
  if (options.esm && !preloaded) {
    throw new global_Error(
      "esm hook must preloaded (with the --experimental-loaded flag)"
    );
  }
  return {
    __proto__: prototype,
    cjs: options.cjs,
    esm: options.esm,
  };
};
