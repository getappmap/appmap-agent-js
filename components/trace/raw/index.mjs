export default (_dependencies) => {
  return {
    compileTrace: (configuration, messages) => ({
      head: configuration,
      body: messages,
    }),
  };
};
