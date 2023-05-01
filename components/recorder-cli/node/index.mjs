import process from "node:process";
import { createServer } from "node:http";
import { hook } from "../../hook/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { generateRespond, requestAsync } from "../../http/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import {
  extendConfigurationNode,
  isConfigurationEnabled,
} from "../../configuration-accessor/index.mjs";
import {
  createFrontend,
  recordStartTrack,
  flushContent,
} from "../../frontend/index.mjs";
import {
  openSocket,
  isSocketReady,
  sendSocket,
  addSocketListener,
} from "../../socket/index.mjs";

const { Promise, setInterval, undefined } = globalThis;

export const recordAsync = (configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (isConfigurationEnabled(configuration)) {
    if (configuration.session === null) {
      configuration = { ...configuration, session: getUuid() };
    }
    const {
      session,
      recorder,
      heartbeat,
      host,
      "frontend-track-port": frontend_track_port,
      "track-port": backend_track_port,
    } = configuration;
    const frontend = createFrontend(configuration);
    hook(frontend, configuration);
    const socket = openSocket(configuration);
    const flush = () => {
      if (isSocketReady(socket)) {
        const content = flushContent(frontend);
        if (content !== null) {
          sendSocket(socket, content);
        }
      }
    };
    if (heartbeat !== null) {
      setInterval(flush, heartbeat).unref();
    }
    process.once("beforeExit", flush);
    process.on("exit", flush);
    process.on("uncaughtExceptionMonitor", flush);
    addSocketListener(socket, "open", flush);
    if (recorder === "remote") {
      logInfo(
        "Enabling remote recording on process #%j -- %j",
        process.pid,
        process.argv,
      );
      logInfo(
        "Remote recording api documention: https://appmap.io/docs/reference/remote-recording-api.html",
      );
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
    } else if (recorder === "process") {
      logInfo(
        "Recording the entire process #%j -- %j",
        process.pid,
        process.argv,
      );
      recordStartTrack(
        frontend,
        `process-${getUuid()}`,
        extendConfiguration(configuration, { sessions: session }, null),
      );
    } else {
      throw new InternalAppmapError("invalid node recorder");
    }
    return new Promise((resolve, reject) => {
      addSocketListener(socket, "error", reject);
      addSocketListener(socket, "open", resolve);
    });
  } /* c8 ignore start */ else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
    return Promise.resolve(undefined);
  } /* c8 ignore stop */
};
