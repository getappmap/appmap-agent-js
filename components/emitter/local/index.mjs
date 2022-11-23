import { logWarning } from "../../log/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import {
  assert,
  generateDeadcode,
  createBox,
  getBox,
  setBox,
} from "../../util/index.mjs";
import {
  createBackend,
  sendBackend,
  takeBackendTrace,
} from "../../backend/index.mjs";

export const openEmitter = (configuration) => ({
  closed: createBox(false),
  backend: createBackend(configuration),
});

export const closeEmitter = ({ closed, backend }) => {
  assert(
    !getBox(closed),
    "closeClient called on already closed client",
    InternalAppmapError,
  );
  setBox(closed, true);
  sendBackend(backend, {
    type: "stop",
    track: null,
    termination: {
      type: "disconnect",
    },
  });
};

export const sendEmitter = ({ backend, closed }, message) => {
  if (getBox(closed)) {
    logWarning("message lost: %j", message);
  } else {
    sendBackend(backend, message);
  }
};

export const takeLocalEmitterTrace = ({ backend }, key) =>
  takeBackendTrace(backend, key).body;

export const requestRemoteEmitterAsync = generateDeadcode(
  "requestRemoteEmitterAsync should not be called on emitter/local",
  InternalAppmapError,
);
