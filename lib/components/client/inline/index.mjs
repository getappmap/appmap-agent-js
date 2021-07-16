export default ({
  Backend: {
    initializeBackend,
    sendBackend,
    terminateBackend,
    promiseBackendTermination,
  },
}) => ({
  initializeClient: initializeBackend,
  sendClient: sendBackend,
  terminateClient: terminateBackend,
  promiseClientTermination: promiseBackendTermination,
});
