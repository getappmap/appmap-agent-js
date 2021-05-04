const makeRequestSync = require("./curl.js");

module.exports = (host, port) => makeRequestSync(2, host, port);
