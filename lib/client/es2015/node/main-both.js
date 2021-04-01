
// https://github.com/nodejs/node/blob/606df7c4e79324b9725bfcfe019a8b75bfa04c3f/test/fixtures/es-module-loaders/transform-source.mjs
// APPMAP_CHANNEL=test APPMAP_TRACE_IDENTIFIER= node --experimental-loader ./loader-name.mjs

// https://github.com/nodejs/node/blob/22293eab481548c7dba3ffd320487d4f267b977b/lib/internal/modules/esm/transform_source.js
// https://github.com/nodejs/node/blob/606df7c4e79324b9725bfcfe019a8b75bfa04c3f/test/fixtures/es-module-loaders/transform-source.mjs

const setup = require("./setup.js");
const hookCJS = require("./hook-cjs.js");
const hookESM = require("./hook-esm.js");

const { instrumentScript, instrumentModule } = setup(process);

exports.transformSource = hookESM(instrumentModule);

hookCJS(instrumentScript);