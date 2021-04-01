
const setup = require("./setup.js");
const hookESM = require("./hook-esm.js");

const { instrumentModule } = setup(process);

exports.transformSource = hookESM(instrumentModule);
