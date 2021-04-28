const makeRequestSync = require("./curl.js");

module.exports = (host, port) => makeRequestSync(3, host, port);
