
export const getBootBlueprint = () => ({log:"info"});

export const createBlueprint = ({
  log,
  recorder,
  validate: { appmap: validate_appmap, message: validate_message },
}) => ({
  log,
  receptor: recorder === "remote" ? "http" : "file",
  emitter: recorder === "manual" ? "local" : "remote-node-tcp",
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});
