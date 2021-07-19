export default ({
  backend: {
    initializeBackend,
    sendBackend,
    terminateBackend,
    asyncBackendTermination,
  },
}) => ({
  initializeClient: initializeBackend,
  sendClient: sendBackend,
  terminateClient: terminateBackend,
  asyncClientTermination: asyncBackendTermination,
});
