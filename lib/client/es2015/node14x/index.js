const VirtualMachine = require("vm");
const { hook } = require("./hook/index.js");
const { makeChannel } = require("./channel/index.js");
const { makeAppmap, makeAppmapAsync } = require("../appmap.js");

const global_Object_assign = Object.assign;
const global_process = process;

const run = (script) => VirtualMachine.runInThisContext(script);

const makeMakeAppmap = (callback) => (options) => {
  options = global_Object_assign(
    {
      protocol: "inline",
      port: 0,
      host: "localhost",
      configuration: { data: {}, path: global_process.cwd() },
    },
    options
  );
  return callback(
    makeChannel(options.protocol, options.host, options.port),
    hook,
    run,
    options.configuration
  );
};

exports.makeAppmap = makeMakeAppmap(makeAppmap);

exports.makeAppmapAsync = makeMakeAppmap(makeAppmapAsync);
