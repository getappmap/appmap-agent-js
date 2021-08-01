const _Promise = Promise;

export default (dependencies) => {
  const {
    util: { createBox, getBox, setBox },
  } = dependencies;
  return {
    createClient: ({}) => ({
      buffer: [],
      interrupt: createBox(null),
    }),
    executeClientAsync: async ({ buffer, interrupt }) => {
      await new _Promise((resolve) => {
        setBox(interrupt, resolve);
      });
      return buffer;
    },
    interruptClient: ({ interrupt }) => {
      getBox(interrupt)();
    },
    sendClient: ({ buffer }, data) => {
      buffer.push(data);
    },
  };
};
