const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { constant },
  } = dependencies;
  return {
    openClient: ({}) => {
      let resolve, reject;
      const termination = new _Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return {
        buffer: [],
        resolve,
        reject,
        termination,
      };
    },
    promiseClientTermination: ({ termination }) => termination,
    closeClient: ({ resolve, buffer }) => {
      resolve(buffer);
    },
    listenClientAsync: constant(_Promise.resolve(_undefined)),
    traceClient: ({ buffer }, data) => {
      buffer.push(data);
    },
    trackClientAsync: async ({ buffer }, method, path, body) => {
      buffer.push({ method, path, body });
      return { code: 200, message: "ok", body: null };
    },
  };
};
