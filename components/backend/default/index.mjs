const { Map, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { logDebug } = await import(`../../log/index.mjs${__search}`);
const { validateMessage } = await import(
  `../../validate-message/index.mjs${__search}`
);
const { compileTrace } = await import(`../../trace/index.mjs${__search}`);

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

export const sendBackend = (
  { configuration, sources, tracks, traces },
  message,
) => {
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
      for (const [key, messages] of tracks) {
        messages.push(message);
        assert(!traces.has(key), "duplicate trace", InternalAppmapError);
        traces.set(key, compileTrace(configuration, messages));
      }
      tracks.clear();
    } else {
      assert(tracks.has(key), "missing track", InternalAppmapError);
      assert(!traces.has(key), "duplicate trace", InternalAppmapError);
      const messages = tracks.get(key);
      messages.push(message);
      tracks.delete(key);
      traces.set(key, compileTrace(configuration, messages));
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
