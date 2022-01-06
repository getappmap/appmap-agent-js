import { pathToFileURL } from "url";
import Configuration from "../../dist/node/configuration.mjs";
import ManualRecorder from "../../dist/node/recorder-manual.mjs";

const { cwd } = process;
const url = pathToFileURL(cwd()).toString();

const { createConfiguration, extendConfiguration } = Configuration({
  log: "info",
  violation: "error",
});

export const createAppmap = (home = url, conf = {}, base = url) => {
  const configuration = extendConfiguration(
    createConfiguration(home),
    conf,
    base,
  );
  const {
    log,
    validate: { message: validate_message, appmap: validate_appmap },
  } = configuration;
  const { Appmap } = ManualRecorder({
    log,
    "validate-message": validate_message ? "on" : "off",
    "validate-appmap": validate_appmap ? "on" : "off",
  });
  return new Appmap(configuration);
};
