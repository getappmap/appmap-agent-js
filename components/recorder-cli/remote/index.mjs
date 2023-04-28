import process from "node:process";
import { createServer } from "node:http";
import { hook } from "../../hook/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { generateRespond, requestAsync } from "../../http/index.mjs";
import {
  extendConfigurationNode,
  isConfigurationEnabled,
} from "../../configuration-accessor/index.mjs";
import {
  createFrontend,
  flush as flushFrontend,
} from "../../frontend/index.mjs";
import {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
} from "../../socket/index.mjs";

const {
  setInterval,
  JSON: { stringify: stringifyJSON },
} = globalThis;

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
    if (configuration.session === null) {
      configuration = { ...configuration, session: getUuid() };
    }
    const {
      heartbeat,
      host,
      "frontend-track-port": frontend_track_port,
      "track-port": backend_track_port,
    } = configuration;
    const frontend = createFrontend(configuration);
    hook(frontend, configuration);
    const socket = createSocket(configuration);
    const flush = () => {
      if (isSocketReady(socket)) {
        for (const message of flushFrontend(frontend)) {
          sendSocket(socket, stringifyJSON(message));
        }
      }
    };
    if (heartbeat !== null) {
      setInterval(flush, heartbeat).unref();
    }
    process.once("beforeExit", flush);
    process.on("exit", flush);
    process.on("uncaughtExceptionMonitor", flush);
    openSocketAsync(socket).then(flush);
    if (frontend_track_port !== null) {
      const server = createServer();
      server.unref();
      /* c8 ignore start */
      server.on(
        "request",
        generateRespond((method, path, body) =>
          requestAsync(
            host,
            backend_track_port,
            method,
            `/_appmap${path}`,
            body,
          ),
        ),
      );
      /* c8 ignore start */
      server.listen(frontend_track_port);
    }
  } /* c8 ignore start */ else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  } /* c8 ignore stop */
};
