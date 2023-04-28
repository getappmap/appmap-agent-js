import process from "node:process";
import { getUuid } from "../../uuid/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import {
  extendConfigurationNode,
  isConfigurationEnabled,
} from "../../configuration-accessor/index.mjs";
import {
  createFrontend,
  flush as flushFrontend,
  recordStartTrack,
} from "../../frontend/index.mjs";
import { hook } from "../../hook/index.mjs";
import {
  createSocket,
  openSocketAsync,
  sendSocket,
  isSocketReady,
} from "../../socket/index.mjs";

const {
  setInterval,
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const record = (configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (isConfigurationEnabled(configuration)) {
    logInfo(
      "Recording the entire process #%j -- %j",
      process.pid,
      process.argv,
    );
    if (configuration.session === null) {
      configuration = { ...configuration, session: getUuid() };
    }
    const { session, heartbeat } = configuration;
    const frontend = createFrontend(configuration);
    recordStartTrack(
      frontend,
      `process-${getUuid()}`,
      extendConfiguration(configuration, { sessions: session }, null),
    );
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
  } /* c8 ignore start */ else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  } /* c8 ignore stop */
};
