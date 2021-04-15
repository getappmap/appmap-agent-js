const VirtualMachine = require("vm");
const FileSystem = require("fs");
const Path = require("path");
const makeChannel = require("./channel.js");

const global_Error = Error;

module.exports = (process) => {

  const { requestSync, requestAsync, env } = makeChannel(process.env);

  const { session, prefix } = requestSync({
    name: "initialize",
    env,
    init: {
      pid: process.pid,
      engine: `node@${process.version}`,
      feature: "TODO",
      feature_group: "TODO",
      labels: ["TODO"],
      frameworks: ["TODO"],
      recording: {
        defined_class: "TODO",
        method_id: "TODO",
      },
    },
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
