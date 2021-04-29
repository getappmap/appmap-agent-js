const VirtualMachine = require("vm");
const FileSystem = require("fs");
const Path = require("path");
const makeChannel = require("./channel.js");

const global_Error = Error;

module.exports = (process) => {
  const { requestSync, requestAsync, inline } = makeChannel(process.env);

  const { session, prefix } = requestSync({
    name: "initialize",
    process: {
      version: process.version,
      arch: process.arch,
      platform: process.platform,
      pid: process.pid,
      ppid: process.ppid,
      env: process.env,
      execPath: process.execPath,
      execArgv: process.execArgv,
      argv: process.argv,
    },
    configuration: {},
    // configuration: {
    //   "map-name": process.argv[1],
    //   feature: "TODO",
    //   "feature-group": "TODO",
    //   labels: [],
    //   frameworks: [],
    //   "recording-defined-class": "TODO",
    //   "recording-method-id": "TODO",
    //   "recorder-name": "TODO",
    // },
  });

  if (session === null) {
    return {
      instrumentModule: (path, content, pending) => {
        pending.resolve(content);
      },
      instrumentScript: (path, content) => content,
    };
  }

  VirtualMachine.runInThisContext(
    FileSystem.readFileSync(
      Path.join(__dirname, "..", "script.js"),
      "utf8"
    ).replace(
      /APPMAP_GLOBAL_([A-Z_]+)/gu,
      (match, part) => `${prefix}_GLOBAL_${part}`
    )
  );

  /* eslint-disable no-eval */
  eval(`
    "use strict";
    ${prefix}_GLOBAL_RECORD = (event) => requestAsync({name:"record", session, event}, null);
    ${prefix}_GLOBAL_PROCESS_ID = process.pid;
  `);
  /* eslint-enable no-eval */

  {
    let terminated = false;
    const terminate = (reason) => {
      if (!terminated) {
        terminated = true;
        requestSync({
          name: "terminate",
          session,
          sync: inline,
          reason,
        });
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

  return {
    instrumentModule: (path, content, pending) => {
      requestAsync(
        {
          name: "instrument",
          session,
          source: "module",
          path,
          content,
        },
        pending
      );
    },
    instrumentScript: (path, content) =>
      requestSync({
        name: "instrument",
        session,
        source: "script",
        path,
        content,
      }),
  };
};
