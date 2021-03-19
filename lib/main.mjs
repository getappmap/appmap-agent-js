
import * as Vm from "vm";
import * as Minimist from "minimist";
import Logger from "./logger.mjs";
import Settings from "./settings.mjs";
import Git from "./git.mjs";
import Namespace from "./namespace.mjs";
import * as Bundler from "./bundler.mjs";
import * as Visitor from "./visitor";

const logger = new Logger(import.meta.url);

export const main = (options) {
  options = {
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
    Vm.runScriptInThisContext(Bundler.bundler(namespace, {
      ecma: argv.ecma,
      platform: argv.platform,
      channel: argv.channel
    }));
    return Vm.runScriptInThisContext(Instrumenter.instrument(Fs.readFileSync(options.main, "utf8"), namespace));
  }
  logger.error(`Unsupported channel, got: ${options.channel}`);
};


