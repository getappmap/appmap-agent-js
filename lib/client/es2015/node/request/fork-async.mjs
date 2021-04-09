
// process is an event emitter and send is directly added to it and not to its prototype
// cf: https://github.com/nodejs/node/blob/master/lib/internal/child_process.js

const global_Reflect_apply = Reflect.apply;
const global_process = process;
const global_Error = Error;
const global_undefined = undefined;
const global_process_send = process.send;
const global_Reflect_getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;

const getFreeIndex = (array) => {
  for (let index = 0; index < array.length; index += 1) {
    if (array[index] === null) {
      return index;
    }
  }
  return array.length;
}

const checkTypeof = (value, type) => {
  if (typeof value !== type) {
    throw new global_Error(`Invalid value type expected a ${type} and got a ${typeof value}`);
  }
}

const checkNotNull = (value) => {
  if (value === null) {
    throw new global_Error("Unexpected null value");
  }
}

const checkHas = (object, key) => {
  if (global_Reflect_getOwnPropertyDescriptor(object, key) === global_undefined) {
    throw new global_Error(`Missing property ${key}`);
  }
};

module.exports = () => {
  const pendings = [];
  process.on("message", (json) => {
    checkTypeof(json, "object");
    checkNotNull(json);
    checkHas(json, "index");
    checkHas(json, "success");
    checkHas(json, "failure");
    checkTypeof(json.index, "number");
    checkHas(pendings, json.index);
    const pending = pendings[json.index];
    pendings[json.index] = null;
    if (json.failure === null) {
      pending.resolve(json.success);
    } else {
      checkTypeof(json.failure, "string");
      pending.reject(new global_Error(json.failure));
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
};
