export default ({
  backend: {
    createBackend,
    initializeBackend,
    sendBackend,
    terminateBackend,
    asyncBackendTermination,
  },
}) => ({
  createClient: createBackend,
  initializeClient: initializeBackend,
  sendClient: sendBackend,
  terminateClient: terminateBackend,
  asyncClientTermination: asyncBackendTermination,
});
