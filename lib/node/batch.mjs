import { loadComponentAsync } from "../load.mjs";
import "./error.mjs";
const { process } = globalThis;

const { loadProcessConfiguration } = await loadComponentAsync(
  "configuration-process",
  {
    env: "node",
    "validate-message": "off",
    "validate-appmap": "off",
  },
);

const configuration = loadProcessConfiguration(process);

const { mainAsync } = await loadComponentAsync("batch", {
  env: "node",
  emitter: "remote-socket",
  "log-level": configuration.log.level,
  "log-file": configuration.log.file,
  socket: configuration.socket,
  "validate-appmap": configuration.validate.appmap ? "on" : "off",
  "validate-message": configuration.validate.message ? "on" : "off",
});

export default mainAsync(process, configuration);
