const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

const { logWarning } = await import(`../../log/index.mjs${__search}`);
const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert, generateDeadcode, createBox, getBox, setBox } = await import(
  `../../util/index.mjs${__search}`
);
const { createBackend, sendBackend, takeBackendTrace } = await import(
  `../../backend/index.mjs${__search}`
);

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
