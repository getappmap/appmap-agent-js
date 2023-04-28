import { getUuid } from "../../uuid/index.mjs";
import {
  createFrontend,
  flushContent,
  recordStartTrack,
} from "../../frontend/index.mjs";
import { hook } from "../../hook/index.mjs";
import {
  createSocket,
  isSocketReady,
  openSocketAsync,
  sendSocket,
} from "../../socket/index.mjs";

const { window, setInterval } = globalThis;

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
      const content = flushContent(frontend);
      if (content !== null) {
        sendSocket(socket, content);
      }
    }
  };
  if (heartbeat !== null) {
    setInterval(flush, heartbeat);
  }
  window.addEventListener("beforeunload", flush);
  openSocketAsync(socket).then(flush);
};
