exports.mochaHooks = require("./mocha-main.js").makeMochaHooks(process);

const {main:{main}} = buildAsync();

export const {transformSource, mochaHooks} = main(process);
