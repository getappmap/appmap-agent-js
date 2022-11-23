const { Map, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { validateMessage } from "../../validate-message/index.mjs";
import { compileTrace } from "../../trace/index.mjs";

export const createBackend = (configuration) => ({
  configuration,
  sources: [],
  tracks: new Map(),
  traces: new Map(),
});

export const getBackendTrackIterator = ({ tracks }) => tracks.keys();

export const getBackendTraceIterator = ({ traces }) => traces.keys();

export const hasBackendTrack = ({ tracks }, key) => tracks.has(key);

export const hasBackendTrace = ({ traces }, key) => traces.has(key);

export const takeBackendTrace = ({ traces }, key) => {
  assert(traces.has(key), "missing trace", InternalAppmapError);
  const trace = traces.get(key);
  traces.delete(key);
  return trace;
};

const stopTrack = ({ configuration, tracks, traces }, key, message) => {
  assert(tracks.has(key), "missing track", InternalAppmapError);
  const track = tracks.get(key);
  tracks.delete(key);
  track.push(message);
  assert(!traces.has(key), "duplicate trace", InternalAppmapError);
  traces.set(key, compileTrace(configuration, track));
};

export const sendBackend = (backend, message) => {
  const { sources, tracks } = backend;
  validateMessage(message);
  logDebug("message >> %j", message);
  const { type } = message;
  if (type === "start") {
    const { track: key } = message;
    assert(!tracks.has(key), "duplicate track", InternalAppmapError);
    tracks.set(key, [...sources, message]);
  } else if (type === "stop") {
    const { track: key } = message;
    if (key === null) {
      for (const key of tracks.keys()) {
        stopTrack(backend, key, message);
      }
    } else {
      stopTrack(backend, key, message);
    }
  } else {
    if (type === "source") {
      sources.push(message);
    }
    for (const messages of tracks.values()) {
      messages.push(message);
    }
  }
};
