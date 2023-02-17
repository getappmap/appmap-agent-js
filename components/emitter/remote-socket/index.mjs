import { InternalAppmapError } from "../../error/index.mjs";
import {
  generateDeadcode,
  assert,
  createBox,
  setBox,
  getBox,
} from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { requestAsync } from "../../http/index.mjs";
import { openSocket, closeSocket, sendSocket } from "../../socket/index.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const openEmitter = (configuration) => {
  let {
    host,
    "trace-port": trace_port,
    "track-port": track_port,
  } = configuration;
  if (host === "localhost") {
    host = "127.0.0.1";
  }
  const socket = openSocket(host, trace_port, configuration);
  return { socket, host, track_port, closed: createBox(false) };
};

export const closeEmitter = ({ socket, closed }) => {
  assert(
    !getBox(closed),
    "emitter has already been closed",
    InternalAppmapError,
  );
  setBox(closed, true);
  closeSocket(socket);
};

export const sendEmitter = ({ socket, closed }, message) => {
  if (getBox(closed)) {
    logWarning("message lost: %j", message);
  } else {
    sendSocket(socket, stringifyJSON(message));
  }
};

export const takeLocalEmitterTrace = generateDeadcode(
  "takeLocalEmitterTrace should not be called on emitter/remote-node-posix",
  InternalAppmapError,
);

/* c8 ignore start */
export const requestRemoteEmitterAsync = (
  { host, track_port },
  method,
  path,
  body,
) => requestAsync(host, track_port, method, `/_appmap${path}`, body);
/* c8 ignore stop */
