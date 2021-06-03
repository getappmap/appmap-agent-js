const { assert } = require("../check.js");

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/client/hook/esm.js must be preloaded with --experimental loader");
// }};

const { hookCJS } = require("./cjs.js");
const { hookESM } = require("./esm.js");
const { hookHTTP } = require("./http.js");
const { hookMySQL } = require("./mysql.js");

const hooks = {
  __proto__: null,
  cjs: ["instrumentScript", hookCJS],
  esm: ["instrumentModuleAsync", hookESM],
  http: ["recordCall", hookHTTP],
  mysql: ["recordCall", hookMySQL],
};

let running = false;

exports.hook = (hooking, traps) => {
  assert(!running, "another hook is already running");
  running = true;
  let unhooks = [];
  for (let name in hooking) {
    if (hooking[name]) {
      unhooks[unhooks.length] = hooks[name][1](traps[hooks[name][0]]);
    }
  }
  return () => {
    assert(unhooks !== null, "this hook has already been stopped");
    for (let index = 0; index < unhooks.length; index += 1) {
      unhooks[index]();
    }
    unhooks = null;
    running = false;
  };
};
