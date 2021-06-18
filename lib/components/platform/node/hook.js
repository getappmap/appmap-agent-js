const { assert } = require("../check.js");

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/client/hook/esm.js must be preloaded with --experimental loader");
// }};

const global_Reflect_apply = Reflect.apply;
const global_Array_prototype_map = Array.prototype.map;
const global_Reflect_ownKeys = Reflect.ownKeys;
const global_Array_prototype_forEach = Array.prototype.forEach;

const { hookCJS } = require("./cjs.js");
const { hookESM } = require("./esm.js");
const { hookHTTP } = require("./http.js");
const { hookMySQL } = require("./mysql.js");
const { hookPG } = require("./pg.js");
const { hookSQLite3 } = require("./sqlite3.js");

const hooking = {
  __proto__: null,
  cjs: [hookCJS, "instrumentScript"],
  esm: [hookESM, "instrumentModuleAsync"],
  http: [hookHTTP, "makeCouple"],
  mysql: [hookMySQL, "makeCouple"],
  pg: [hookPG, "makeCouple"],
  sqlite3: [hookSQLite3, "makeCouple"],
};

const call = (closure) => {
  closure();
};

let running = false;

const noop = () => {};

exports.hook = (hooks, traps) => {
  assert(!running, "another hook is already running");
  running = true;
  let unhooks = global_Reflect_apply(
    global_Array_prototype_map,
    global_Reflect_ownKeys(hooks),
    [
      (key) => {
        const { 0: hook, 1: name } = hooking[key];
        const options = hooks[key];
        if (options === null) {
          return noop;
        }
        const trap = traps[name];
        return hook(options, trap);
      },
    ]
  );
  return {
    unhook,
    getThreadId
  return () => {
    assert(unhooks !== null, "this hook has already been stopped");
    global_Reflect_apply(global_Array_prototype_forEach, unhooks, [call]);
    unhooks = null;
    running = false;
  };
};
