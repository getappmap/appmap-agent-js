// import * as AsyncHooks from 'async_hooks';
// import * as FileSystem from "fs";
// import * as Util from "util"

const AsyncHooks = require("async_hooks");
const {log} = require("./async-hook-log.js");

exports.hook = AsyncHooks.createHook({
  init: (id, type, parent_id, resource) => {
    log(`init-${type} >> ${parent_id} -> ${id}`);
  },
  before: (id) => {
    log(`before ${id}`);
  },
  after: (id) => {
    log(`after ${id}`);
  },
  destroy: (id) => {
    log(`destroy ${id}`);
  }
}).enable();
