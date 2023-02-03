import { InternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { mapMaybe, generateDeadcode } from "../../util/index.mjs";
import {
  createBackend,
  sendBackend,
  compileBackendTrack,
} from "../../backend/index.mjs";

const SESSION = "_appmap";

export const sendEmitter = (backend, message) => {
  logErrorWhen(
    !sendBackend(backend, SESSION, message),
    "backend failure >> %j",
    message,
  );
};

export const openEmitter = (configuration) => {
  const backend = createBackend(configuration);
  sendEmitter(backend, { type: "open" });
  return backend;
};

export const closeEmitter = (backend) => {
  sendEmitter(backend, { type: "close" });
};

const getContent = ({ content }) => content;

export const takeLocalEmitterTrace = (backend, track) =>
  mapMaybe(compileBackendTrack(backend, SESSION, track), getContent);

export const requestRemoteEmitterAsync = generateDeadcode(
  "requestRemoteEmitterAsync should not be called on emitter/local",
  InternalAppmapError,
);
