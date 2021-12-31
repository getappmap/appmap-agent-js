import ConfigurationProcess from "../../dist/node/configuration-process.mjs";
import Batch from "../../dist/node/batch.mjs";

const { loadProcessConfiguration } = ConfigurationProcess({ log: "info" });
const configuration = loadProcessConfiguration(process);
const {
  log,
  validate: { message: validate_message, appmap: validate_appmap },
} = configuration;
const { mainAsync } = Batch({
  log,
  "validate-appmap": validate_appmap ? "on" : "off",
  "validate-message": validate_message ? "on" : "off",
});
mainAsync(process, configuration);
