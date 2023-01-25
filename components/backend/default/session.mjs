import { logError } from "../../log/index.mjs";
import { identity } from "../../util/index.mjs";
import { compileTrace } from "../../trace/index.mjs";

const {
  Map,
  Array: { from: toArray },
} = globalThis;

const startTrack = ({ tracks }, key, message) => {
  if (tracks.has(key)) {
    logError("Duplicate track for %j", message);
    return false;
  } else {
    tracks.set(key, [message]);
    return true;
  }
};

// We do no compile the trace at this points because additional
// source messages may still arrive. That is because the tranformer
// may reside on a different process.
const closeTrack = ({ tracks, traces }, key, message) => {
  if (tracks.has(key)) {
    if (traces.has(key)) {
      logError("duplicate trace for %j", message);
      return false;
    } else {
      const messages = tracks.get(key);
      tracks.delete(key);
      messages.push(message);
      traces.set(key, messages);
      return true;
    }
  } else {
    logError("missing track for %j", message);
    return false;
  }
};

export const createSession = () => ({
  sources: [],
  tracks: new Map(),
  traces: new Map(),
});

export const hasSessionTrack = ({ tracks }, key) => tracks.has(key);

export const compileSessionTrace = ({ traces, sources }, key) => {
  if (traces.has(key)) {
    const messages = traces.get(key);
    traces.delete(key);
    return compileTrace([...sources, ...messages]);
  } else {
    return null;
  }
};

export const compileSessionTraceArray = (session) =>
  toArray(session.traces.keys()).map((key) =>
    compileSessionTrace(session, key),
  );

export const sendSession = (session, message) => {
  const { type } = message;
  if (type === "start") {
    return startTrack(session, message.track, message);
  } else if (type === "stop") {
    const { track: key } = message;
    if (key === null) {
      return toArray(session.tracks.keys())
        .map((key) => closeTrack(session, key, message))
        .every(identity);
    } else {
      return closeTrack(session, key, message);
    }
  } else {
    if (type === "source") {
      session.sources.push(message);
    } else {
      for (const track of session.tracks.values()) {
        track.push(message);
      }
    }
    return true;
  }
};
