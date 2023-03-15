import { createServer } from "node:http";
import { hook } from "../../hook/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { generateRespond } from "../../http/index.mjs";
import { openAgent, requestRemoteAgentAsync } from "../../agent/index.mjs";

export const record = (process, configuration) => {
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
};
