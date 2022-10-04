const {
  URLSearchParams,
  process,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { loadProcessConfiguration } = await import(
  `../../components/configuration-process/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
    log: "info",
    "validate-message": "off",
    "validate-appmap": "off",
  }).toString()}`
);

const configuration = loadProcessConfiguration(process);

process.env.APPMAP_LOG_FILE = stringifyJSON(configuration.log.file);

const { mainAsync } = await import(
  `../../components/batch/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
    log: configuration.log.level,
    socket: configuration.socket,
    "validate-appmap": configuration.validate.appmap ? "on" : "off",
    "validate-message": configuration.validate.message ? "on" : "off",
  }).toString()}`
);

export default mainAsync(process, configuration);
