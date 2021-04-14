const { connect } = require("net");
const { patch } = require("net-socket-messaging");

const global_Error = Error;
// const global_undefined = undefined;
// const global_Reflect_getOwnPropertyDescriptor =
//   Reflect.getOwnPropertyDescriptor;
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

// const checkTypeof = (value, type) => {
//   if (typeof value !== type) {
//     throw new global_Error(
//       `Invalid value type expected a ${type} and got a ${typeof value}`
//     );
//   }
// };
//
// const checkNotNull = (value) => {
//   if (value === null) {
//     throw new global_Error("Unexpected null value");
//   }
// };
//
// const checkHas = (object, key) => {
//   if (
//     global_Reflect_getOwnPropertyDescriptor(object, key) === global_undefined
//   ) {
//     throw new global_Error(`Missing property ${key}`);
//   }
// };

module.exports = (host, port) => {
  const socket = typeof port === "number" ? connect(port, host) : connect(port);
  socket.setNoDelay(true);
  socket.setKeepAlive(true);
  socket.unref();
  patch(socket);
  const pendings = [];
  socket.on("message", (message) => {
    const json = global_JSON_parse(message);
    // checkTypeof(json, "object");
    // checkNotNull(json);
    // checkHas(json, "index");
    // checkHas(json, "success");
    // checkHas(json, "failure");
    // checkTypeof(json.index, "number");
    // checkHas(pendings, json.index);
    const pending = pendings[json.index];
    pendings[json.index] = null;
    if (json.failure === null) {
      pending.resolve(json.success);
    } else {
      // checkTypeof(json.failure, "string");
      pending.reject(new global_Error(json.failure));
    }
  });
  return (json, pending) => {
    let index = null;
    if (pending !== null) {
      index = getFreeIndex(pendings);
      pendings[index] = pending;
    }
    socket.send(
      global_JSON_stringify({
        index,
        query: json,
      })
    );
  };
};
