
const ChildProcess = require("child_process");

// process is an event emitter and send is directly added to it and not to its prototype
// cf: https://github.com/nodejs/node/blob/master/lib/internal/child_process.js

const global_Reflect_apply = Reflect.apply;
const global_process = process;
const global_process_send = process.send;

const getFreeIndex = (array) => {
  for (let index = 0; index < array.length; index++) {
    if (array[index] === null) {
      return index;
    }
  }
  return array.length;
}

module.exports = () => {
  const pendings = [];
  process.on("message", (json) => {
    const pending = pendings[json.index];
    pendings[json.index] = null;
    if (json.error !== null) {
      if (typeof json.error !== "string") {
        reject(new global_Error(`Invalid error field got: ${global_JSON_stringify(json.error)}`));
      } else {
        reject(new global_Error(json.error));
      }
    } else {
      resolve(json.result);
    }
  });
  return (json, pending) => {
    let index = null;
    if (pending !== null) {
      index = getFreeIndex(pendings);
      pendings[index] = pending;
    }
    global_Reflect_apply(global_process_send, global_process, [{
      index,
      data: json
    }]);
  };
}:
