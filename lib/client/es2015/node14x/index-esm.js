const Path = require("path");
require("./check-version.js");
const Argv = require("./argv.js");
const setup = require("./setup.js");
const hookESM = require("./hook-esm.js");

const global_undefined = undefined;

process.execArgv = Argv.removeNamedArgument(
  process.execArgv,
  "--experimental-loader",
  __filename,
  Path.resolve
);

const { enabled, instrumentModule } = setup(process);

exports.transformSource = global_undefined;
if (enabled) {
  exports.transformSource = hookESM(instrumentModule);
}
