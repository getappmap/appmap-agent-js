
const setup = require("./setup.js");
const hookCommonJS = require("./hook-common-js.js");

const {instrumentScript} = setup(process);
hookCommonJS(instrumentScript);
