const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    util: { generateDeadcode },
  } = dependencies;
  return {
    respond: generateDeadcode("respond should not be called on request stub"),
    requestAsync: generateDeadcode(
      "requestAsync should not be called on request stub",
    ),
    openResponder: (respond) => {
      let resolve, reject;
      const termination = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      return { termination, resolve, reject };
    },
    promiseResponderTermination: ({ termination }) => termination,
    listenResponderAsync: ({}) => _Promise.resolve(_undefined),
    closeResponder: ({ resolve }) => {
      resolve();
    },
    getResponderPort: ({}) => 0,
  };
};
