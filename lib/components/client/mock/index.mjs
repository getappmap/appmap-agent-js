export default (dependencies) => {
  return {
    initializeClient: ({ buffer }) => {
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
