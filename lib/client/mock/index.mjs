export default (dependencies) => {
  return {
    initializeClient: ({ "client-mock-buffer": buffer }) => {
      let resolveTermination = null;
      return {
        buffer,
        termination: new Promise((resolve) => {
          resolveTermination = resolve;
        }),
        resolveTermination,
      };
    },
    terminateClient: ({ resolveTermination }) => {
      resolveTermination();
    },
    sendClient: ({ buffer }, data) => {
      buffer.push(data);
    },
    asyncClientTermination: ({ termination }) => termination,
  };
};
