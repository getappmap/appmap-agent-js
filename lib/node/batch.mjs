const { URLSearchParams, process } = globalThis;

import "./error.mjs";

const { loadProcessConfiguration } = await import(
  `../../components/configuration-process/index.mjs?${new URLSearchParams({
    env: "node",
  }).toString()}`
);

const configuration = loadProcessConfiguration(process);

const { mainAsync } = await import(
  `../../components/batch/index.mjs?${new URLSearchParams({
    env: "node",
    "log-level": configuration.log.level,
    "log-file": configuration.log.file,
    socket: configuration.socket,
  }).toString()}`
);

export default mainAsync(process, configuration);
