
let APPMAP_GLOBAL_INITIALIZE;
let APPMAP_GLOBAL_TERMINATE;
let APPMAP_GLOBAL_INSTRUMENT_MODULE;
let APPMAP_GLOBAL_INSTRUMENT_SCRIPT;
let APPMAP_GLOBAL_EMIT;

{
  const global_XMLHttpRequest = XMLHttpRequest;
  const global_Reflect_apply = Reflect.apply;
  const global_process = process;
  const global_Promise = Promise;
  // process is an event emitter and send is directly added to it and not to its prototype
  // cf: https://github.com/nodejs/node/blob/master/lib/internal/child_process.js
  const global_process_send = process.send;
  const send = (type, data) => global_Reflect_apply(global_process_send, global_process, [{type, data}]);
  APPMAP_GLOBAL_INITIALIZE = (data) => send("initialize", data);
  APPMAP_GLOBAL_TERMINATE = (data) => send("terminate", data);
  APPMAP_GLOBAL_EMIT = (data) => send("event", data);
  let counter = 0;
  const pendings = {__proto__:null};
  process.on("message", (data) => {
    const {resolve, reject} = pendings[data.id];
    delete pendings[data.id];
    if (data.error !== null) {
      reject(new global_Error(data.error));
    } else {
      resolve(data.result);
    }
  });
  APPMAP_GLOBAL_INSTRUMENT_MODULE = (path, content) => {
    counter += 1;
    const id = counter;
    const promise = new global_Promise((resolve, reject) => {
      prendings[id] = {resolve, reject};
    });
    send("instrument", {
      id,
      path,
      content,
    });
    return promise;
  }
  APPMAP_GLOBAL_INSTRUMENT_SCRIPT = (path, content) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = ();
    xhr.open("POST", APPMAP_STATIC_URL);
    xhr.setRequestHeader("path", path);
    xhr.send(content);
  }
}
