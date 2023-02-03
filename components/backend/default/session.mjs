import { logError } from "../../log/index.mjs";
import { identity } from "../../util/index.mjs";
import { startTrack, stopTrack, sendTrack, compileTrack } from "./track.mjs";

const {
  Map,
  Array: { from: toArray },
} = globalThis;

const processStartMessage = ({ tracks, sources }, key, message) => {
  if (tracks.has(key)) {
    logError("Duplicate track for %j", message);
    return false;
  } else {
    const track = startTrack();
    for (const source of sources) {
      sendTrack(track, source);
    }
    sendTrack(track, message);
    tracks.set(key, track);
    return true;
  }
};

// We do no compile the track at this points because additional
// source messages may still arrive. That is because the tranformer
// may reside on a different process.
const processStopMessage = ({ tracks }, key, message) => {
  if (tracks.has(key)) {
    const track = tracks.get(key);
    sendTrack(track, message);
    stopTrack(track);
    return true;
  } else {
    logError("missing track for %j", message);
    return false;
  }
};

export const createSession = () => ({
  sources: [],
  tracks: new Map(),
});

export const hasSessionTrack = ({ tracks }, key) => tracks.has(key);

export const compileSessionTrack = ({ tracks }, key) => {
  if (tracks.has(key)) {
    const track = tracks.get(key);
    tracks.delete(key);
    return compileTrack(track);
  } else {
    return null;
  }
};

export const compileSessionTrackArray = (session) =>
  toArray(session.tracks.keys()).map((key) =>
    compileSessionTrack(session, key),
  );

export const sendSession = (session, message) => {
  const { type } = message;
  if (type === "start") {
    return processStartMessage(session, message.track, message);
  } else if (type === "stop") {
    const { track: key } = message;
    if (key === null) {
      return toArray(session.tracks.keys())
        .map((key) => processStopMessage(session, key, message))
        .every(identity);
    } else {
      return processStopMessage(session, key, message);
    }
  } else {
    if (type === "source") {
      session.sources.push(message);
    }
    for (const track of session.tracks.values()) {
      sendTrack(track, message);
    }
    return true;
  }
};
