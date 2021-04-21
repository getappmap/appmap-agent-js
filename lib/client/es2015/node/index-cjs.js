const setup = require("./setup.js");
const hookCJS = require("./hook-cjs.js");

const { instrumentScript } = setup(`--require=${__filename}`, process);

hookCJS(instrumentScript);
