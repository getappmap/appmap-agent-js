const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logInfo } = await import(`../../log/index.mjs${__search}`);
const { hook } = await import(`../../hook/index.mjs${__search}`);
const { isConfigurationEnabled, extendConfigurationNode } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { openAgent, recordStartTrack } = await import(
  `../../agent/index.mjs${__search}`
);

export const main = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  const enabled = isConfigurationEnabled(configuration);
  if (enabled) {
    logInfo(
      "Recording the entire process #%j -- %j",
      process.pid,
      process.argv,
    );
    const agent = openAgent(configuration);
    hook(agent, configuration);
    recordStartTrack(agent, "process", {}, null);
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  }
};
