const _Promise = Promise;

export default (dependencies) => {
  const {} = dependencies;
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
    sendClient: ({ buffer }, data) => {
      buffer.push(data);
    },
  };
};
