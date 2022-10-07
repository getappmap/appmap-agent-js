const { URLSearchParams, process } = globalThis;

const { loadProcessConfiguration } = await import(
  `../../components/configuration-process/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
    "validate-message": "off",
    "validate-appmap": "off",
  }).toString()}`
);

const configuration = loadProcessConfiguration(process);

const { mainAsync } = await import(
  `../../components/batch/index.mjs?${new URLSearchParams({
    env: "node",
    violation: "exit",
    "log-level": configuration.log.level,
    "log-file": configuration.log.file,
    socket: configuration.socket,
    "validate-appmap": configuration.validate.appmap ? "on" : "off",
    "validate-message": configuration.validate.message ? "on" : "off",
  }).toString()}`
);

export default mainAsync(process, configuration);
