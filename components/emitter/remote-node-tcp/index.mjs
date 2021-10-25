import { connect } from "net";
import { createMessage } from "net-socket-messaging";
import { writeSync } from "fs";

const STATE0 = 0;
const STATE1 = 1;
const STATE2 = 2;

const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    util: { generateDeadcode, assert, createBox, setBox, getBox },
    log: { logWarning },
    uuid: { getUUID },
    http: { requestAsync },
  } = dependencies;
  const generateFlush =
    ({ socket, state, buffers }) =>
    () => {
      if (getBox(state) !== STATE2) {
        assert(getBox(state) === STATE0, "Duplicate socket connection");
        setBox(state, STATE1);
        socket.unref();
        for (const buffer of buffers) {
          writeSync(socket._handle.fd, buffer);
        }
        buffers.length = 0;
      }
    };
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
      const emitter = {
        socket: connect(
          ...(typeof trace_port === "string"
            ? [trace_port]
            : [trace_port, host]),
        ),
        state: createBox(STATE0),
        buffers: [
          createMessage(session),
          createMessage(stringifyJSON(configuration)),
        ],
        session,
        host,
        track_port,
      };
      emitter.socket.on("connect", generateFlush(emitter));
      return emitter;
    },
    closeEmitter: ({ socket, state }) => {
      assert(getBox(state) !== STATE2, "emitter has already been closed");
      setBox(state, STATE2);
      socket.end();
    },
    sendEmitter: ({ socket, state, buffers }, message) => {
      if (getBox(state) === STATE2) {
        logWarning("message lost: %j", message);
      } else {
        const buffer = createMessage(stringifyJSON(message));
        if (getBox(state) === STATE1) {
          writeSync(socket._handle.fd, buffer);
        } else {
          buffers.push(buffer);
        }
      }
    },
    takeLocalEmitterTrace: generateDeadcode(
      "takeLocalEmitterTrace should not be called on emitter/remote-node-tcp",
    ),
    requestRemoteEmitterAsync: (
      { host, track_port, session },
      method,
      path,
      body,
    ) => requestAsync(host, track_port, method, `/${session}${path}`, body),
  };
};
