const _Promise = Promise;

export default (dependencies) => {
  const {
    util: { generateDeadcode },
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
    traceClient: ({ buffer }, data) => {
      buffer.push(data);
    },
    trackClient: generateDeadcode(
      "trackClient should not be called on spy client",
    ),
    trackClientAsync: generateDeadcode(
      "trackClientAsync should not be called on spy client",
    ),
  };
};
