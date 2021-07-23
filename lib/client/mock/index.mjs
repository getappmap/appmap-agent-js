export default (dependencies) => {
  const {util:{coalesce}} = dependencies;
  return {
    initializeClient: (options) => {
      const buffer = coalesce(options, "client-mock-buffer", []);
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
