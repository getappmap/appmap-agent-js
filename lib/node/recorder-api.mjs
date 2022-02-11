import { pathToFileURL } from "url";
import Configuration from "../../dist/node/configuration.mjs";
import Recorder from "../../dist/node/recorder-api.mjs";

const { cwd } = process;
const url = pathToFileURL(cwd()).toString();

const { createConfiguration, extendConfiguration } = Configuration({
  log: "info",
  violation: "error",
});

export const createAppMap = (home = url, conf = {}, base = url) => {
  const configuration = extendConfiguration(
    createConfiguration(home),
    conf,
    base,
  );
  const {
    log,
    validate: { message: validate_message, appmap: validate_appmap },
  } = configuration;
  const { Appmap } = Recorder({
    log,
    "validate-message": validate_message ? "on" : "off",
    "validate-appmap": validate_appmap ? "on" : "off",
  });
  return new Appmap(configuration);
};
