export default (_dependencies) => ({
  compileTrace: (configuration, messages) => ({
    head: configuration,
    body: messages,
  }),
});
