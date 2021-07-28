const _Promise = Promise;

export default (dependencies) => {
  const {
    util: { createBox, getBox, setBox },
  } = dependencies;
  return {
    initializeClient: ({ "client-spy-buffer": buffer }) => {
      let resolve;
      const promise = new _Promise((_resolve) => {
        resolve = _resolve;
      });
      return { buffer, promise, resolve, terminated: createBox(false) };
    },
    terminateClient: ({ resolve, terminated }) => {
      setBox(terminated, true);
      resolve();
    },
    sendClient: ({ buffer, terminated }, data) => {
      if (!getBox(terminated)) {
        buffer.push(data);
      }
    },
    asyncClientTermination: ({ promise }) => promise,
  };
};
