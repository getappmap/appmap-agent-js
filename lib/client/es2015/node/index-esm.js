const setup = require("./setup.js");
const hookESM = require("./hook-esm.js");

const { instrumentModule } = setup(
  `--experimental-loader=${__filename}`,
  process
);

exports.transformSource = hookESM(instrumentModule);
