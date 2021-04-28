const Path = require("path");
require("./check-version.js");
const Argv = require("./argv.js");
const setup = require("./setup.js");
const hookESM = require("./hook-esm.js");

process.execArgv = Argv.removeNamedArgument(
  process.execArgv,
  "--experimental-loader",
  __filename,
  Path.resolve
);

const { instrumentModule } = setup(
  {
    cjs: false,
    esm: true,
    argv: ["--experimental-loader", __filename],
  },
  process
);

exports.transformSource = hookESM(instrumentModule);
