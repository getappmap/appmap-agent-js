const { connect } = require("net");
const { patch } = require("net-socket-messaging");

const global_undefined = undefined;
const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

const getFreeIndex = (array) => {
  for (let index = 0; index < array.length; index += 1) {
    if (array[index] === null) {
      return index;
    }
  }
  return array.length;
};

exports.makeRequestAsync = (host, port, callback) => {
  const socket = typeof port === "number" ? connect(port, host) : connect(port);
  socket.on("error", callback);
  socket.setNoDelay(true);
  socket.setKeepAlive(true);
  socket.unref();
  patch(socket);
  let counter = 0;
  const pendings = [];
  socket.on("message", (message) => {
    const json = global_JSON_parse(message);
    if (json.head === null) {
      if (json.type === "left") {
        return callback(new global_Error(json.body));
      }
      if (json.type === "right") {
        if (json.body === null) {
          return callback(null);
        }
        return callback(new global_Error("expected null response body"));
      }
      return callback(new global_Error("invalid response type"));
    }
    counter -= 1;
    if (counter === 0) {
      socket.unref();
    }
    const pending = pendings[json.head];
    pendings[json.head] = null;
    if (json.type === "left") {
      return pending.reject(new global_Error(json.body));
    }
    if (json.type === "right") {
      return pending.resolve(json.body);
    }
    return pending.reject(new global_Error("invalid response type"));
  });
  return (json, discarded) => {
    if (discarded) {
      socket.send(
        global_JSON_stringify({
          head: null,
          body: json,
        })
      );
      return global_undefined;
    }
    return new Promise((resolve, reject) => {
      if (counter === 0) {
        socket.ref();
      }
      counter += 1;
      const index = getFreeIndex(pendings);
      pendings[index] = { resolve, reject };
      socket.send(
        global_JSON_stringify({
          head: index,
          body: json,
        })
      );
    });
  };
};
