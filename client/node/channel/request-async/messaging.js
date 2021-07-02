const { connect } = require("net");
const { patch } = require("net-socket-messaging");
const { assert, expect } = require("../../check.js");
const { makeErrorHandler } = require("./error.js");

/* c8 ignore start */
const noop = () => {};
/* c8 ignore stop */

const global_undefined = undefined;
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

const onSocketError = makeErrorHandler("socket");

exports.makeRequestAsync = (host, port, callback = noop) => {
  const socket = typeof port === "number" ? connect(port, host) : connect(port);
  socket.on("error", onSocketError);
  socket.setNoDelay(true);
  socket.setKeepAlive(true);
  socket.unref();
  patch(socket);
  let counter = 0;
  const pendings = [];
  socket.on("message", (message) => {
    const data = global_JSON_parse(message);
    expect(data.type !== "left", data.body);
    assert(data.type === "right", "invalid response type: %j", data.type);
    assert(data.head !== null, "unexpected null response head");
    counter -= 1;
    if (counter === 0) {
      socket.unref();
    }
    const resolve = pendings[data.head];
    pendings[data.head] = null;
    resolve(data.body);
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
    return new Promise((resolve) => {
      if (counter === 0) {
        socket.ref();
      }
      counter += 1;
      const index = getFreeIndex(pendings);
      pendings[index] = resolve;
      socket.send(
        global_JSON_stringify({
          head: index,
          body: json,
        })
      );
    });
  };
};
