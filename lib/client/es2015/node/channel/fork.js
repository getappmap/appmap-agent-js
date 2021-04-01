//
// const ChildProcess = require("child_process");
//
// const global_Reflect_apply = Reflect.apply;
// const global_process = process;
// const global_Promise = Promise;
//
// module.exports = (env) => {
//   // process is an event emitter and send is directly added to it and not to its prototype
//   // cf: https://github.com/nodejs/node/blob/master/lib/internal/child_process.js
//   const global_process_send = process.send;
//   const send = (type, data) => global_Reflect_apply(global_process_send, global_process, [{type, data}]);
//   let counter = 0;
//   const pendings = {__proto__:null};
//   process.on("message", (data) => {
//     const {resolve, reject} = pendings[data.id];
//     delete pendings[data.id];
//     if (data.error !== null) {
//       reject(new global_Error(data.error));
//     } else {
//       resolve(data.result);
//     }
//   });
//   return {
//     initialize: (data) => send("initialize", data),
//     terminate: (reason) => send("terminate", reason),
//     emit: (event) => send("emit", event),
//     instrumentModule: (content, path, pending) => {
//       counter += 1;
//       const id = counter;
//       pendings[id] = pending;
//       send("instrumentModule", {
//         id,
//         path,
//         content,
//       });
//     },
//     instrumentScript: (content, path) => {
//       const xhr = new XMLHttpRequest();
//       xhr.onload = ();
//       xhr.open("POST", APPMAP_STATIC_URL);
//       xhr.setRequestHeader("path", path);
//       xhr.send(content);
//     }
//   };
// }
