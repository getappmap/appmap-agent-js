
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

export default = ({frontend}, options) => (options) => {
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
      hooking[name].start(traps);
    }
  }
  return {
    transformSource,
    startTrack,
    terminate: (reason) => {
      terminate(reason);
      for (const name of names) {
        if (hooks[name]) {
          hooking[name].stop(traps);
        }
      }
    }
  };
};



  startHooking(traps, options.hooks);
  return {
    terminate: (data) => {
      stopHooking();
      terminate(data);
    },
    startTrack: () => {

    }
  };
};

  runScript,
  getCurrentAsync,
  startHooking: (traps) => {
    startHooking(traps, options);
  },
  stopHooking
});
