// sql-trace.mjs
import util from "util";
import sqlite3 from "sqlite3";
import { trace, traceAsync } from "./trace.mjs";
const db = new sqlite3.Database(":memory:");
const execute = util.promisify(db.all.bind(db));
const logTrace = (x) => trace(log, x);
const main = () => {
  traceAsync(execute, "SELECT 2 * 3 as x").then(([{ x }]) => {
    trace(console.log, x);
  });
  traceAsync(execute, "SELECT 4 * 5 as x").then(([{ x }]) => {
    trace(console.log, x);
  });
  return 0;
};
trace(main);
