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

const { Promise, window, setInterval, undefined } = globalThis;

export const recordAsync = (configuration) => {
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
  // We do not want to wait for the socket in browser setting.
  // That is because we want to be sure that this code is
  // evaluated before the observed application.
  // In the other recorders, there is a mechanism to wait for
  // the promise returned by this function before evaluating
  // the rest of the code.
  return Promise.resolve(undefined);
};
