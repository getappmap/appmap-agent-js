
export const getBootBlueprint = () => ({log:"info"});

export const createBlueprint = ({
  mode,
  log,
  validate: { appmap: validate_appmap, message: validate_message },
}) => ({
  log,
  receptor: mode === "local" ? "stub" : "tcp",
  client: mode === "local" ? "inline" : "node-tcp",
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});
