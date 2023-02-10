import { logDebug, logError } from "../../log/index.mjs";
import { validateMessage } from "../../validate/index.mjs";
import { identity } from "../../util/index.mjs";
import { fromSourceMessage } from "../../source/index.mjs";
import {
  startTrack,
  stopTrack,
  sendTrack,
  compileTrack,
  addTrackSource,
  isTrackComplete,
} from "./track.mjs";

const {
  Map,
  Array: { from: toArray },
} = globalThis;

const isNotNull = (any) => any !== null;

const processStartMessage = ({ tracks, sources }, key, configuration) => {
  if (tracks.has(key)) {
    logError("Duplicate track %j", key);
    return false;
  } else {
    const track = startTrack(configuration);
    for (const source of sources) {
      addTrackSource(track, source);
    }
    tracks.set(key, track);
    return true;
  }
};

// We do no compile the track at this points because additional
// source messages may still arrive. That is because the tranformer
// may reside on a different process.
const processStopMessage = ({ tracks }, key, termination) => {
  if (tracks.has(key)) {
    const track = tracks.get(key);
    stopTrack(track, termination);
    return true;
  } else {
    logError("missing track %j", key);
    return false;
  }
};

export const createBackend = (configuration) => ({
  configuration,
  sources: [],
  tracks: new Map(),
});

export const hasBackendTrack = ({ tracks }, key) => tracks.has(key);

export const compileBackendTrack = ({ tracks }, key, abrupt) => {
  if (tracks.has(key)) {
    const track = tracks.get(key);
    if (abrupt || isTrackComplete(track)) {
      tracks.delete(key);
      return compileTrack(track);
    } else {
      return null;
    }
  } else {
    return null;
  }
};

export const compileBackendTrackArray = (backend, abrupt) =>
  toArray(backend.tracks.keys())
    .map((key) => compileBackendTrack(backend, key, abrupt))
    .filter(isNotNull);

export const isBackendEmpty = ({ tracks }) => tracks.size === 0;

export const sendBackend = (backend, message) => {
  logDebug("message >> %j", message);
  if (backend.configuration.validate.message) {
    validateMessage(message);
  }
  const { type } = message;
  if (type === "start") {
    return processStartMessage(backend, message.track, message.configuration);
  } else if (type === "stop") {
    const { track: key } = message;
    if (key === null) {
      return toArray(backend.tracks.keys())
        .map((key) => processStopMessage(backend, key, message.termination))
        .every(identity);
    } else {
      return processStopMessage(backend, key, message.termination);
    }
  } else if (type === "source") {
    const source = fromSourceMessage(message);
    backend.sources.push(source);
    for (const track of backend.tracks.values()) {
      addTrackSource(track, source);
    }
    return true;
  } else {
    for (const track of backend.tracks.values()) {
      sendTrack(track, message);
    }
    return true;
  }
};
