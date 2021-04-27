const VirtualMachine = require("vm");
const FileSystem = require("fs");
const Path = require("path");
const Env = require("./env.js");
const hookChildProcess = require("./hook-child-process.js");
const makeChannel = require("./channel.js");

const global_Error = Error;
const global_Object_assign = Object.assign;

module.exports = (hook, process) => {
  const options = Env.extractOptions(process.env);

  hookChildProcess(hook, options);

  const { requestSync, requestAsync, inline } = makeChannel(options);

  const { session, prefix } = requestSync({
    name: "initialize",
    options: global_Object_assign(
      {
        esm: hook.esm,
        cjs: hook.cjs,
      },
      options
    ),
    // main: require.main.filename, >> does not work for esm modules, fallback to process.argv0
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
    ${prefix}_GLOBAL_EMIT = (event) => requestAsync({name:"emit", session, event}, null);
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
