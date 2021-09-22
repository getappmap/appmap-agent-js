const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  return {
    openServer: (respond) => {
      let resolve, reject;
      const termination = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return { termination, resolve, reject };
    },
    promiseServerTermination: ({ termination }) => termination,
    listenAsync: ({}) => _Promise.resolve(_undefined),
    closeServer: ({ resolve }) => {
      resolve();
    },
    getServerPort: ({}) => 0,
    requestAsync: (host, port, method, path, body) =>
      _Promise.resolve({
        code: 500,
        message: null,
        body: null,
      }),
  };
};
