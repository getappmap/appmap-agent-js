
exports.makeAppmap = ({protocol, data, ... options}) => {

  if (protocol === "inline") {
    const Data = require(`component/data/${data}`)();
    const Respond = require("components/respond/inline")();
    const Server = require("components/server/common")({Data, Request});
    const Platform = require("components/platform/node")();
    const Request = require("components/request/inline")({Server});
    const Client = require("components/client/common")({Platform, Request});
    return Client();
  }

  const Platform = require("components/platform/node")();
  const Request = require(`components/request/${protocol}`)();
  const Client = require("components/client/common")({Platform, Request});
  return Client.make();

};
