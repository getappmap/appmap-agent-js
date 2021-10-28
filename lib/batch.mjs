import Boot from "../dist/node-boot.mjs";
import Batch from "../dist/node-batch.mjs";

const { bootBatch } = Boot({ log: "info", violation: "error" });
const configuration = bootBatch(process);
const {
  log,
  recorder,
  validate: { message: validate_message, appmap: validate_appmap },
} = configuration;
const { mainAsync } = Batch({
  receptor: recorder === "remote" ? "http" : "file",
  log,
  "validate-appmap": validate_appmap ? "on" : "off",
  "validate-message": validate_message ? "on" : "off",
});
mainAsync(process, configuration);
