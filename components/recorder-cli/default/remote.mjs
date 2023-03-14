import { createServer } from "node:http";
import { hook } from "../../hook/index.mjs";
import { generateRespond } from "../../http/index.mjs";
import { openAgent, requestRemoteAgentAsync } from "../../agent/index.mjs";

export const record = (configuration) => {
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
