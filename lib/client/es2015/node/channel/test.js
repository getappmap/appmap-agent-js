
module.exports = (env) => ({
  initialize: (data) => { global[env.APPMAP_TRACE_IDENTIFIER].push(["initialize", data]); },
  terminate: (reason) => { global[env.APPMAP_TRACE_IDENTIFIER].push(["terminate", reason]); },
  emit: (event) => { global[env.APPMAP_TRACE_IDENTIFIER].push(["emit", event]); },
  instrumentModule: (content, path, pending) => {
    global[env.APPMAP_TRACE_IDENTIFIER].push(["instrument-module", path]);
    pending.resolve(`${env.APPMAP_TRACE_IDENTIFIER}.push(["run-module", ${JSON.stringify(path)}]);${content}`);
  },
  instrumentScript: (content, path) => {
    global[env.APPMAP_TRACE_IDENTIFIER].push(["instrument-script", path]);
    return `${env.APPMAP_TRACE_IDENTIFIER}.push(["run-script", ${JSON.stringify(path)}]);${content}`
  }
});
