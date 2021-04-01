const APPMAP_GLOBAL_SEND = ((() => {
  const global_Reflect_apply = Reflect.apply;
  const global_process = process;
  // process is an event emitter and send is directly added to it and not to its prototype
  // cf: https://github.com/nodejs/node/blob/master/lib/internal/child_process.js
  const global_process_send = process.send;
  return (type, data) => global_Reflect_apply(global_process_send, global_process, [{type, data}]);
}) ());
