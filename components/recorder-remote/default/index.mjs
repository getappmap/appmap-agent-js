const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { createServer } from "http";
const { logInfo } = await import(`../../log/index.mjs${__search}`);
const { hook } = await import(`../../hook/index.mjs${__search}`);
const { isConfigurationEnabled, extendConfigurationNode } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { generateRespond } = await import(`../../http/index.mjs${__search}`);
const { openAgent, requestRemoteAgentAsync } = await import(
  `../../agent/index.mjs${__search}`
);

export const main = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  const enabled = isConfigurationEnabled(configuration);
  if (enabled) {
    logInfo(
      "Enabling remote recording on process #%j -- %j",
      process.pid,
      process.argv,
    );
    logInfo(
      "Remote recording api documention: https://appmap.io/docs/reference/remote-recording-api.html",
    );
    const agent = openAgent(configuration);
    hook(agent, configuration);
    const { "frontend-track-port": port } = configuration;
    if (port !== null) {
      const server = createServer();
      server.unref();
      server.on(
        "request",
        generateRespond((method, path, body) =>
          requestRemoteAgentAsync(agent, method, path, body),
        ),
      );
      server.listen(port);
    }
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  }
};
