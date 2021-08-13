
export const createBlueprint = ({
  mode,
  protocol,
  "log-level": log_level,
  validate: { appmap: validate_appmap, message: validate_message },
}) => ({
  log: log_level,
  client: mode === "local" ? "inline" : `node-${protocol}`,
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});
