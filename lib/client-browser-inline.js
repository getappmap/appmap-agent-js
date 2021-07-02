

const Data = require(`component/data/${data}`)();
const Respond = require("components/respond/inline")();
const Server = require("components/server/common")({Data, Request});

const Platform = require("components/thread/empty")();
const Request = require("components/request/inline")();
const Client = require("components/client/common")({
  Platform
  Request
});

exports.makeAppmap = Client.makeAppmap;
exports.makeAppmapAsync = Client.makeAppmpAsync;
