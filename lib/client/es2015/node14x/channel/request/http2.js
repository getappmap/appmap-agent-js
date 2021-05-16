const { makeRequest } = require("./curl.js");

exports.makeRequest = (host, port) => makeRequest(2, host, port);
