// import * as AsyncHooks from 'async_hooks';
// import * as FileSystem from "fs";
// import * as Util from "util"

const {hook} = require("./async-hook.js");
const {log} = require("./async-hook-log.js");

const Sqlite3 = require("sqlite3");
const Util = require("util");

log("foo");
const db = new Sqlite3.Database(':memory:');
log("bar");
db.all('SELECT 2 * 3 as x', (error, result) => {
  log(JSON.stringify(result));
});
log("qux");
