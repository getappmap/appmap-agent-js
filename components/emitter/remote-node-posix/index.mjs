import PosixSocket from "posix-socket";
import PosixSocketMessaging from "posix-socket-messaging";

const {
  AF_INET,
  AF_UNIX,
  SOCK_STREAM,
  socket: createSocket,
  connect: connectSocket,
  close: closeSocket,
} = PosixSocket;
const { send: sendSocket } = PosixSocketMessaging;
const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    util: { generateDeadcode, assert, createBox, setBox, getBox },
    log: { logWarning },
    uuid: { getUUID },
    http: { requestAsync },
  } = dependencies;
  return {
    openEmitter: (configuration) => {
      let {
        host: host,
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
      const fd = createSocket(
        typeof trace_port === "number" ? AF_INET : AF_UNIX,
        SOCK_STREAM,
        0,
      );
      connectSocket(
        fd,
        typeof trace_port === "number"
          ? { sin_family: AF_INET, sin_port: trace_port, sin_addr: host }
          : { sun_family: AF_UNIX, sun_path: trace_port },
      );
      sendSocket(fd, session);
      sendSocket(fd, stringifyJSON(configuration));
      return { fd, session, host, track_port, closed: createBox(false) };
    },
    closeEmitter: ({ fd, closed }) => {
      assert(!getBox(closed), "emitter has already been closed");
      setBox(closed, true);
      closeSocket(fd);
    },
    sendEmitter: ({ fd, closed }, message) => {
      if (getBox(closed)) {
        logWarning("message lost: %j", message);
      } else {
        sendSocket(fd, stringifyJSON(message));
      }
    },
    takeLocalEmitterTrace: generateDeadcode(
      "takeLocalEmitterTrace should not be called on emitter/remote-node-posix",
    ),
    /* c8 ignore start */
    requestRemoteEmitterAsync: (
      { host, track_port, session },
      method,
      path,
      body,
    ) => requestAsync(host, track_port, method, `/${session}${path}`, body),
    /* c8 ignore stop */
  };
};
