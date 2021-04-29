const Path = require("path");
require("./check-version.js");
const Argv = require("./argv.js");
const setup = require("./setup.js");
const hookCJS = require("./hook-cjs.js");

process.execArgv = Argv.removeNamedArgument(
  process.execArgv,
  "--require",
  __filename,
  Path.resolve
);
process.execArgv = Argv.removeNamedArgument(
  process.execArgv,
  "-r",
  __filename,
  Path.resolve
);

const { instrumentScript } = setup(process);

hookCJS(instrumentScript);
