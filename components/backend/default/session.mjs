import { logError } from "../../log/index.mjs";
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

export const createSession = () => ({
  sources: [],
  tracks: new Map(),
});

export const hasSessionTrack = ({ tracks }, key) => tracks.has(key);

export const compileSessionTrack = ({ tracks }, key, abrupt) => {
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

export const compileSessionTrackArray = (session, abrupt) =>
  toArray(session.tracks.keys())
    .map((key) => compileSessionTrack(session, key, abrupt))
    .filter(isNotNull);

export const isSessionEmpty = ({ tracks }) => tracks.size === 0;

export const sendSession = (session, message) => {
  const { type } = message;
  if (type === "start") {
    return processStartMessage(session, message.track, message.configuration);
  } else if (type === "stop") {
    const { track: key } = message;
    if (key === null) {
      return toArray(session.tracks.keys())
        .map((key) => processStopMessage(session, key, message.termination))
        .every(identity);
    } else {
      return processStopMessage(session, key, message.termination);
    }
  } else if (type === "source") {
    const source = fromSourceMessage(message);
    session.sources.push(source);
    for (const track of session.tracks.values()) {
      addTrackSource(track, source);
    }
    return true;
  } else {
    for (const track of session.tracks.values()) {
      sendTrack(track, message);
    }
    return true;
  }
};
