
const Thread = require("components/thread/empty")();

const Script = require("components/script/browser")();

const Request = require("components/request/http-browser")();

const Client = require("components/client/common")({
  Thread,
  Script,
  Request
});
