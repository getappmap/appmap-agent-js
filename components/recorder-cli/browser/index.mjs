import { getUuid } from "../../uuid/index.mjs";
import {
  createFrontend,
  flushContent,
  recordStartTrack,
} from "../../frontend/index.mjs";
import { hook } from "../../hook/index.mjs";
import {
  openSocket,
  isSocketReady,
  addSocketListener,
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
  const socket = openSocket(configuration);
  const flush = () => {
    if (isSocketReady(socket)) {
      const content = flushContent(frontend);
      if (content !== null) {
        sendSocket(socket, content);
      }
    }
  };
  addSocketListener(socket, "open", flush);
  if (heartbeat !== null) {
    setInterval(flush, heartbeat);
  }
  window.addEventListener("beforeunload", flush);
  hook(frontend, configuration);
};
