const {
  JSON: { stringify: stringifyJSON },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { generateDeadcode, assert, createBox, setBox, getBox } = await import(
  `../../util/index.mjs${__search}`
);
const { logWarning } = await import(`../../log/index.mjs${__search}`);
const { getUUID } = await import(`../../uuid/index.mjs${__search}`);
const { requestAsync } = await import(`../../http/index.mjs${__search}`);
const { openSocket, closeSocket, sendSocket } = await import(
  `../../socket/index.mjs${__search}`
);

export const openEmitter = (configuration) => {
  let {
    host,
    "trace-port": trace_port,
    "track-port": track_port,
    session,
  } = configuration;
  if (session === null) {
    session = getUUID();
  }
  if (host === "localhost") {
    host = "127.0.0.1";
  }
  const socket = openSocket(host, trace_port, configuration);
  sendSocket(socket, session);
  sendSocket(socket, stringifyJSON(configuration));
  return { socket, session, host, track_port, closed: createBox(false) };
};

export const closeEmitter = ({ socket, closed }) => {
  assert(!getBox(closed), "emitter has already been closed");
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
);

/* c8 ignore start */
export const requestRemoteEmitterAsync = (
  { host, track_port, session },
  method,
  path,
  body,
) => requestAsync(host, track_port, method, `/${session}${path}`, body);
/* c8 ignore stop */
