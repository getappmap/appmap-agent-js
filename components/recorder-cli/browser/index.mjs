import { getUuid } from "../../uuid/index.mjs";
import {
  createFrontend,
  flush as flushFrontend,
  recordStartTrack,
} from "../../frontend/index.mjs";
import { hook } from "../../hook/index.mjs";
import {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
} from "../../socket/index.mjs";

const {
  window,
  setInterval,
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const record = (configuration) => {
  if (configuration.session === null) {
    configuration = { ...configuration, session: getUuid() };
  }
  const { recorder, session, heartbeat } = configuration;
  const frontend = createFrontend(configuration);
  if (recorder === "process") {
    recordStartTrack(frontend, `process-${getUuid()}`, {
      ...configuration,
      sessions: session,
    });
  }
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
    setInterval(flush, heartbeat);
  }
  window.addEventListener("beforeunload", flush);
  openSocketAsync(socket).then(flush);
};
