
export const createBlueprint = ({
  mode,
  log,
  validate: { appmap: validate_appmap, message: validate_message },
}) => ({
  log,
  client: mode === "local" ? "inline" : "node-tcp",
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});
