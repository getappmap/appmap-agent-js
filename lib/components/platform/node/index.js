
import * as _async from "./async.mjs";
import * as esm from "./esm.mjs";
import * as cjs from "./cjs.mjs";
import * as http from "./http.mjs";
import * as mysql from "./mysql.mjs";
import * as pg from "./pg.mjs";
import * as sqlite3 from "./sqlite3.mjs";

const hooking = {
  "async": _async,
  "esm": esm,
  "cjs": cjs,
  "http": http,
  "mysql": mysql,
  "pg": pg,
  "sqlite3": sqlite3
};

const names = global_Reflect_ownKeys(hooking);

const transformSource = esm.transformSource;

const getCurrentAsync = _async.getCurrentAsync;

let running = false;

export default = ({frontend:{initialize}}, options) => {
  transformSource,
  initializePlatform: (options) => {
    expect(!running, "another appmap instance is already running");
    running = true;
    terminated = false;
    options = {
      hooks: {},
      ... options
    };
    const hooks = {
      async: true,
      esm: true,
      cjs: true,
      http: true,
      mysql: false,
      pg: false,
      sqlite3: false,
      ... options.hooks
    };
    const {startTrack, terminate, ... traps} = frontend(
      getCurrentAsync,
      ... options
    );
    for (const name of names) {
      if (hooks[name]) {
        hooking[name].startHooking(traps);
      }
    }
    return {
      transformSource,
      startTrack,
      terminate: (reason) => {
        for (const name of names) {
          if (hooks[name]) {
            hooking[name].stopHooking(traps);
          }
        }
      }
    };
  }
};
