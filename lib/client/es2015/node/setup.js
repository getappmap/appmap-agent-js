const VirtualMachine = require("vm");
const FileSystem = require("fs");
const Path = require("path");

const global_Object_assign = Object.assign;
const global_Error = Error;

module.exports = (process) => {
  const env = global_Object_assign(
    {
      APPMAP_CHANNEL: "inline",
      APPMAP_ESCAPE: "APPMAP",
    },
    process.end
  );

  /* eslint-disable global-require, import/no-dynamic-require */
  const Channel = require(`./channel/${env.APPMAP_CHANNEL}.js`);
  /* eslint-enable global-require, import/no-dynamic-require */
  const channel = new Channel(env);

  VirtualMachine.runInThisContext(
    FileSystem.readFileSync(Path.join(__dirname, "..", "script.js")).replace(
      /APPMAP_GLOBAL_([A-Z_]+)/gu,
      (match, part) => `${env.APPMAP_ESCAPE}_GLOBAL_${part}`
    )
  );

  /* eslint-disable no-eval */
  eval(`${env.APPMAP_ESCAPE}_GLOBAL_EMIT = channel.emit;`);
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
    /* istanbul ignore next */
    process.on("uncaughtException", (error, origin) => {
      terminate({
        type: "exception",
        error: error instanceof global_Error ? error.stack : error,
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
    platform: "node",
    version: process.version,
    pid: process.id,
    escape: env.APPMAP_ESCAPE,
  });

  return channel;
};
