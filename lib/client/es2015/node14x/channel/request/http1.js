const { makeRequest } = require("./curl.js");

exports.makeRequest = (host, port) => makeRequest(1, host, port);
