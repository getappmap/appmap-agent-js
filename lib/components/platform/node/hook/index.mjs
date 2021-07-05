import { assert } from "../../../util/index.mjs";
import { hookCJS } from "./cjs.mjs";
import { hookESM } from "./esm.mjs";
import { hookHTTP } from "./http.mjs";
import { hookMySQL } from "./mysql.mjs";
import { hookPG } from "./pg.mjs";
import { hookSQLite3 } from "./sqlite3.mjs";

const global_Reflect_apply = Reflect.apply;
const global_Array_prototype_map = Array.prototype.map;
const global_Reflect_ownKeys = Reflect.ownKeys;
const global_Array_prototype_forEach = Array.prototype.forEach;

const hooking = {
  __proto__: null,
  cjs: [hookCJS, "instrumentScript"],
  esm: [hookESM, "instrumentModuleAsync"],
  http: [hookHTTP, "recordRequest", "recordReponse"],
  mysql: [hookMySQL, "recordQuery"],
  pg: [hookPG, "recordQuery"],
  sqlite3: [hookSQLite3, "recordQuery"],
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
  return () => {
    assert(unhooks !== null, "this hook has already been stopped");
    global_Reflect_apply(global_Array_prototype_forEach, unhooks, [call]);
    unhooks = null;
    running = false;
  };
};
