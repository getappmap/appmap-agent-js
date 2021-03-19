
import * as Vm from "vm";
import * as Minimist from "minimist";
import Settings from "./settings.mjs";
import Git from "./git.mjs";
import Namespace from "./namespace.mjs";
import * as Bundler from "./bundler.mjs";

const argv = Minimist(process.argv.slice(2));

const namespace = new Namespace(argv.prefix);

global[namespace.getGlobalAppmapObject()] = new Appmap(new Git(argv["git-path"]), new Settings(process.env));
Vm.runScriptInThisContext(Bundler.bundler(namespace, {
  ecma: argv.ecma,
  platform: argv.platform,
  channel: argv.channel
}));
