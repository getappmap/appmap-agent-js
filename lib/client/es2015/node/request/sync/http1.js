const makeRequestSync = require("./curl.js");

module.exports = (host, port) => makeRequestSync(1, host, port);
