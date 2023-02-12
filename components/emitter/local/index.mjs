import { InternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { mapMaybe, generateDeadcode } from "../../util/index.mjs";
import {
  createBackend,
  sendBackend,
  compileBackendTrack,
} from "../../backend/index.mjs";

export const sendEmitter = (backend, message) => {
  logErrorWhen(
    !sendBackend(backend, message),
    "backend failure >> %j",
    message,
  );
};

export const openEmitter = (configuration) => {
  const backend = createBackend(configuration);
  return backend;
};

export const closeEmitter = (_backend) => {};

const getContent = ({ content }) => content;

export const takeLocalEmitterTrace = (backend, track) =>
  mapMaybe(compileBackendTrack(backend, track, true), getContent);

export const requestRemoteEmitterAsync = generateDeadcode(
  "requestRemoteEmitterAsync should not be called on emitter/local",
  InternalAppmapError,
);
