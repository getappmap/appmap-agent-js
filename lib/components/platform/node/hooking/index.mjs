import { assert } from "../../../util/index.mjs";
import * as CJS from "./cjs.mjs";
import * as ESM from "./esm.mjs";
import * as HTTP from "./http.mjs";
import * as MySQL from "./mysql.mjs";
import * as PG from "./pg.mjs";
import * as Sqlite3 from "./sqlite3.mjs";

const hooking = new Map(
  [
    ["cjs", CJS],
    ["esm", ESM],
    ["http", HTTP],
    ["mysql", MySQL],
    ["pg", PG],
    ["sqlite3", Sqlite3]
  ]
);

let running = null;

export const startHooking = (traps, options) => {
  assert(running === null, "cannot start hook");
  running = {
    esm: true,
    cjs: true,
    http: true,
    mysql: false,
    pg: false,
    sqlite3: false,
    ... options
  };
  for (const [name, {startHooking}] of hooking) {
    if (running[name]) {
      startHooking(traps);
    }
  }
};

export const stopHooking = () => {
  assert(running !== null, "cannot stop hook");
  for (const [name, {stopHooking}] of hooking) {
    if (running[name]) {
      stopHooking();
    }
  }
  running = null;
};
