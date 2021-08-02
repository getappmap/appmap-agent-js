const _Promise = Promise;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { createBox, getBox, setBox },
  } = dependencies;
  return {
    createClient: ({}) => ({
      buffer: [],
      interrupt: createBox(null),
    }),
    executeClientAsync: async ({ buffer, interrupt }) => {
      await new _Promise((resolve) => {
        assert(getBox(interrupt) === null, "client is already running");
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
