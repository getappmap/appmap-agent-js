const { strict: Assert } = require("assert");

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/client/hook/esm.js must be preloaded with --experimental loader");
// }};

const { hookCJS } = require("./cjs.js");
const { hookESM } = require("./esm.js");
const { hookHTTP } = require("./http.js");

const hooks = {
  __proto__: null,
  cjs: hookCJS,
  esm: hookESM,
  http: hookHTTP,
};

let running = false;

exports.hook = (traps) => {
  Assert.equal(running, false);
  running = true;
  let unhooks = [];
  for (let name in traps) {
    if (traps[name] !== null) {
      unhooks[unhooks.length] = hooks[name](traps[name]);
    }
  }
  return () => {
    Assert.notEqual(unhooks, null);
    for (let index = 0; index < unhooks.length; index += 1) {
      unhooks[index]();
    }
    unhooks = null;
    running = false;
  };
};
