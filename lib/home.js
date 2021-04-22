
// This file must be placed at lib/home.js because it also bundled into dist/inline.js and __dirname is not modified.

const Path = require("path");

exports.home = Path.resolve(__dirname, "..");
