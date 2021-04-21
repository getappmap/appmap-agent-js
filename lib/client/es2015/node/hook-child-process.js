const ChildProcess = require("child_process");
const Env = require("./env.js");

const global_Object_assign = Object.assign;
const global_process = process;
const global_Array_isArray = Array.isArray;
const global_TypeError = TypeError;
const global_Reflect_apply = Reflect.apply;
const global_Array_prototype_concat = Array.prototype.concat;
const global_undefined = undefined;

const { execPath } = process;

const save = global_Object_assign({ __proto__: null }, ChildProcess);

module.exports = (origin, opts) => {
  if (opts["hook-child-process"]) {
    const hookArguments = (args, options) => {
      if (!global_Array_isArray(args)) {
        if (typeof args !== "object" && args !== global_undefined) {
          throw new global_TypeError(
            `The "args" arguments must of type object. Receive type ${typeof args}`
          );
        }
        options = args;
        args = [];
      }
      options = global_Object_assign({ __proto__: null }, options);
      options.env = Env.combineOptions(
        ("env" in options ? options : global_process).env,
        opts
      );
      return { args, options };
    };
    // https://github.com/nodejs/node/blob/87805375645f7af36fce2e59289559f746a7131d/lib/child_process.js#L431
    const hookSpawnArguments = (command, args, options) => {
      if (command === "node" || command === execPath) {
        ({ args, options } = hookArguments(args, options));
        args = global_Reflect_apply(
          global_Array_prototype_concat,
          [origin],
          [args]
        );
      }
      return { command, args, options };
    };
    ChildProcess.spawn = function spawn(command, args, options) {
      ({ command, args, options } = hookSpawnArguments(command, args, options));
      return save.spawn(command, args, options);
    };
    ChildProcess.spawnSync = function spawnSync(command, args, options) {
      ({ command, args, options } = hookSpawnArguments(command, args, options));
      return save.spawnSync(command, args, options);
    };
    ChildProcess.fork = function fork(path, args, options) {
      ({ args, options } = hookArguments(args, options));
      options.execArgv = global_Reflect_apply(
        global_Array_prototype_concat,
        [origin],
        ("execArgv" in options ? options : global_process).execArgv
      );
      return save.fork(path, args, options);
    };
  }
};
