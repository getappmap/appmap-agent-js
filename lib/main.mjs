
import * as Vm from "vm";
import * as Minimist from "minimist";
import Logger from "./logger.mjs";
import Settings from "./settings.mjs";
import Git from "./git.mjs";
import Namespace from "./namespace.mjs";
import bundle from "./bundle.mjs";
import instrument from "./instrument/index.mjs";

const logger = new Logger(import.meta.url);

export default (options) => {
  options = {
    target: null,
    prefix: "FOO",
    ecma: 2015,
    platform: "node",
    channel: "local",
    "git-path": process.cwd(),
    "main": undefined,
    _: [],
    ...options
  };
  if (options.channel === "local") {
    process.argv = ["node", options.main, ... options._];
    const namespace = new Namespace(argv.prefix);
    global[namespace.getGlobalAppmapObject()] = new Appmap(new Git(argv["git-path"]), new Settings(process.env));
    Vm.runScriptInThisContext(bundle(namespace, {
      ecma: options.ecma,
      platform: options.platform,
      channel: options.channel
    }));
    const file = new File(options.target, options.ecma, "script");
    return Vm.runScriptInThisContext(instrument(file, namespace));
  }
  logger.error(`Unsupported channel, got: ${options.channel}`);
};
