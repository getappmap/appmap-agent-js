Error.stackTraceLimit = 1 / 0;

const setup = require("./setup.js");
const hookCJS = require("./hook-cjs.js");

const { instrumentScript } = setup(process);

hookCJS(instrumentScript);
