
module.exports = (env) => {
  const trace = [];
  global[env.APPMAP_TRACE_IDENTIFIER] = trace;
  return {
    initialize: (data) => {
      trace.push(["initialize", data]);
    },
    terminate: (reason) => {
      trace.push(["terminate", reason]);
    },
    emit: (event) => {
      trace.push(["emit", event]);
    },
    instrumentModule: (content, path, pending) => {
      trace.push(["instrument-module", path]);
      pending.resolve(
        `${env.APPMAP_TRACE_IDENTIFIER}.push(["run-module", ${JSON.stringify(
          path
        )}]);${content}`
      );
    },
    instrumentScript: (content, path) => {
      trace.push(["instrument-script", path]);
      return `${
        env.APPMAP_TRACE_IDENTIFIER
      }.push(["run-script", ${JSON.stringify(path)}]);${content}`;
    },
  };
};
