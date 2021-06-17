const FileSystem = require("fs");
const AsyncHooks = require("async_hooks");
const {fd} = process.stdout;
exports.log = (message) => {
  FileSystem.writeSync(
    fd,
    `${
      AsyncHooks.triggerAsyncId()
    } -> ${
      AsyncHooks.executionAsyncId()
    } >> ${message}${
      "\n"
    }`
  );
};
