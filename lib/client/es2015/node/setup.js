const VirtualMachine = require("vm");
const FileSystem = require("fs");
const Path = require("path");

const global_Object_assign = Object.assign;
const global_Error = Error;

module.exports = (process) => {
  const env = global_Object_assign(
    {
      APPMAP_CHANNEL: "inline",
      APPMAP_ESCAPE_PREFIX: "APPMAP",
      APPMAP_ECMASCRIPT_VERSION: 2020
    },
    process.env
  );

  /* eslint-disable global-require, import/no-dynamic-require */
  const channel = require(`./channel/${env.APPMAP_CHANNEL}.js`)(env);
  /* eslint-enable global-require, import/no-dynamic-require */

  VirtualMachine.runInThisContext(
    FileSystem.readFileSync(Path.join(__dirname, "..", "script.js"), "utf8").replace(
      /APPMAP_GLOBAL_([A-Z_]+)/gu,
      (match, part) => `${env.APPMAP_ESCAPE_PREFIX}_GLOBAL_${part}`
    )
  );

  /* eslint-disable no-eval */
  eval(`${env.APPMAP_ESCAPE_PREFIX}_GLOBAL_EMIT = channel.emit;`);
  eval(`${env.APPMAP_ESCAPE_PREFIX}_GLOBAL_PID = process.id;`);
  /* eslint-enable no-eval */

  {
    let terminated = false;
    const terminate = (reason) => {
      if (!terminated) {
        terminated = true;
        channel.terminate(reason);
      }
    };
    process.on("exit", (code, origin) => {
      terminate({
        type: "exit",
        code,
        origin,
      });
    });
    process.on("uncaughtException", (error, origin) => {
      terminate({
        type: "exception",
        error: error instanceof global_Error ? error.message : error,
        origin,
      });
      throw error;
    });
    process.on("SIGINT", () => {
      terminate({
        type: "SIGINT",
      });
    });
    process.on("SIGTERM", () => {
      terminate({
        type: "SIGTERM",
      });
    });
  }

  channel.initialize({
    env: process.env,
    pid: process.pid,
    engine: `node@${process.version}`,
    feature: "TODO",
    feature_group: "TODO",
    labels: ["TODO"],
    frameworks: ["TODO"],
    recording: {
      defined_class: "TODO",
      method_id: "TODO"
    },
  });

  return channel;

};
