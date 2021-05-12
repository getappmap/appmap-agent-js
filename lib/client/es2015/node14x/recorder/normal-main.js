
const {parseConfigurationData, parseBoolean} = require("./env.js");
const {makeAppmapSync} = require("../index.js");

const global_Reflect_apply = Reflect.apply;
const global_RegExp_prototype_test = RegExp.prototype.test;
const global_parseInt = parseInt;
const global_Object_assign = Object.assign;

exports.main = (process) => {

  const options = {__proto__:null};

  const env = global_Object_assign({__proto__:null}, process.env);

  if ("APPMAP_PROTOCOL" in env) {
    options.protocol = env.APPMAP_PROTOCOL
    delete env.APPMAP_PROTOCOL;
  }

  if ("APPMAP_HOST" in env) {
    options.host = env.APPMAP_HOST;
    delete env.APPMAP_HOST;
  }

  if ("APPMAP_PORT" in env) {
    if (
      global_Reflect_apply(global_RegExp_prototype_test, /^[0-9]+$/, [
        env.APPMAP_PORT,
      ])
    ) {
      options.port = global_parseInt(env.APPMAP_PORT);
    } else {
      options.port = env.APPMAP_PORT;
    }
    delete env.APPMAP_PORT;
  }

  if ("APPMAP_HOOK_ESM" in env) {
    options["hook-esm"] = parseBoolean(env.APPMAP_HOOK_ESM);
    delete env.APPMAP_HOOK_ESM;
  }

  if ("APPMAP_HOOK_CJS" in env) {
    options["hook-cjs"] = parseBoolean(env.APPMAP_HOOK_CJS);
    delete env.APPMAP_HOOK_CJS;
  }

  options.process = process;

  options.configuration = {
    data: parseConfigurationData(env),
    path: process.cwd()
  };

  const appmap = makeAppmapSync(options);

  appmap.startSync({
    data: {},
    path: null
  });

  process.on('exit', (code, signal) => {
    appmap.terminateSync({type: 'exit', code, signal});
  });

};
