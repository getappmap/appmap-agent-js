import process from "node:process";
import { createServer } from "node:http";
import { hook } from "../../hook/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { generateRespond } from "../../http/index.mjs";
import {
  extendConfigurationNode,
  isConfigurationEnabled,
} from "../../configuration-accessor/index.mjs";
import { openAgent, requestRemoteAgentAsync } from "../../agent/index.mjs";

export const record = (configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (isConfigurationEnabled(configuration)) {
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
  } /* c8 ignore start */ else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  } /* c8 ignore stop */
};
