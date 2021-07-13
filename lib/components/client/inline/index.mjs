export default (
  { backend: { initializeBackend, sendBackend, terminateBackend } },
  configuration,
) => ({
  initializeClient: initializeBackend,
  sendClient: sendBackend,
  terminateClient: terminateBackend,
});
