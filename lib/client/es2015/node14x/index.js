
const VirtualMachine = require("vm");
const {makeHook, isHookESMEnabled} = require("./hook/index.js");
const {makeChannel} = require("./channel/index.js");
const {makeAppmap, makeAppmapSync} = require("../appmap.js");

const global_Object_assign = Object.assign;
const global_process = process;

const run = (script) => VirtualMachine.runInThisContext(script);

const makeMakeAppmap = (callback) => (options) => {
  options = global_Object_assign({
    process: global_process,
    configuration: {data:{}, path:global_process.cwd()},
    protocol: "inline",
    port: 0,
    host: "localhost",
    'hook-esm': isHookESMEnabled(),
    'hook-cjs': true,
  }, options);
  return callback(
    makeChannel(options.protocol, options.host, options.port),
    makeHook({
      esm: options["hook-esm"],
      cjs: options["hook-cjs"]
    }),
    run,
    {
      process: {
        cwd: options.process.cwd(),
        version: options.process.version,
        arch: options.process.arch,
        platform: options.process.platform,
        pid: options.process.pid,
        ppid: options.process.ppid,
        env: options.process.env,
        execPath: options.process.execPath,
        execArgv: options.process.execArgv,
        argv: options.process.argv,
      },
      navigator: null,
      configuration: options.configuration
    }
  );
};

exports.makeAppmapSync = makeMakeAppmap(makeAppmapSync);

exports.makeAppmap = makeMakeAppmap(makeAppmap);
