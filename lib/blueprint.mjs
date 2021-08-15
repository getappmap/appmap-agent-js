export const createBlueprint = ({
  mode,
  protocol,
  log,
  validate: { appmap: validate_appmap, message: validate_message },
}) => ({
  log,
  client: mode === "local" ? "inline" : `node-${protocol}`,
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});
