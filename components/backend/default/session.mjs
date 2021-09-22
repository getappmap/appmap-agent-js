import Track from "./track.mjs";

const _Map = Map;
const _Set = Set;
const EMPTY = [];

const INITIAL_STATE = 0;
const FINAL_STATE = 1;

export default (dependencies) => {
  const {
    util: { assert, createBox, setBox, getBox },
    log: { logDebug },
    "validate-message": { validateMessage },
  } = dependencies;
  const {
    createServedTrack,
    createStoredTrack,
    isServedTrack,
    isStoredTrack,
    serveTrack,
    storeTrack,
  } = Track(dependencies);
  const terminateSession = (session, termination) => {
    const configuration = getBox(session.box);
    setBox(session.box, FINAL_STATE);
    if (typeof configuration === "number") {
      return EMPTY;
    }
    const options = {
      files: session.files,
      configuration,
    };
    const storables = [];
    for (const [key, track] of session.tracks) {
      if (isStoredTrack(track)) {
        storables.push(storeTrack(track, options, termination));
      } else {
        session.traces.set(key, serveTrack(track, options, termination));
      }
    }
    return storables;
  };
  const take = (map, key) => {
    const value = map.get(key);
    map.delete(key);
    return value;
  };
  return {
    isEmptySession: ({ box, traces }) =>
      getBox(box) === FINAL_STATE && traces.size === 0,
    openSession: () => ({
      files: [],
      paths: new _Set(),
      tracks: new _Map(),
      traces: new _Map(),
      box: createBox(INITIAL_STATE),
    }),
    respondSession: (session, method, path, body) => {
      const parts = /^\/([^/]+)$/u.exec(path);
      if (parts === null) {
        return {
          code: 400,
          message: "malformed url: missing track segment",
          body: null,
        };
      }
      const [, segment] = parts;
      if (method === "POST") {
        const state = getBox(session.box);
        if (state === INITIAL_STATE) {
          return { code: 409, message: "not yet initialized", body: null };
        }
        if (state === FINAL_STATE) {
          return { code: 409, message: "already terminated", body: null };
        }
        if (session.tracks.has(segment) || session.traces.has(segment)) {
          return { code: 409, message: "duplicate track", body: null };
        }
        session.tracks.set(
          segment,
          createServedTrack({ path: null, options: {} }),
        );
        return { code: 200, message: null, body: null };
      }
      if (method === "GET") {
        return {
          code: 200,
          message: null,
          body: {
            enabled:
              session.tracks.has(segment) &&
              isServedTrack(session.tracks.get(segment)),
          },
        };
      }
      if (method === "DELETE") {
        if (session.traces.has(segment)) {
          const trace = session.traces.get(segment);
          session.traces.delete(segment);
          return {
            code: 200,
            message: null,
            body: trace,
          };
        }
        if (session.tracks.has(segment)) {
          assert(
            typeof getBox(session.box) !== "number",
            "expected running state",
          );
          if (isStoredTrack(session.tracks.get(segment))) {
            return {
              code: 404,
              message: "track cannot be served",
              body: null,
            };
          }
          return {
            code: 200,
            message: null,
            body: serveTrack(
              take(session.tracks, segment),
              {
                files: session.files,
                configuration: getBox(session.box),
              },
              { errors: [], status: 0 },
            ),
          };
        }
        return {
          code: 404,
          message: "missing trace",
          body: null,
        };
      }
      return {
        code: 400,
        message: "unsupported method",
        body: null,
      };
    },
    sendSession: (session, message) => {
      logDebug("session received: %j", message);
      validateMessage(message);
      const type = message[0];
      if (type === "event") {
        const [, type, index, time, data_type, data_rest] = message;
        const event = {
          type,
          index,
          time,
          data: {
            type: data_type,
            ...data_rest,
          },
        };
        for (const { events } of session.tracks.values()) {
          events.push(event);
        }
        return EMPTY;
      }
      if (type === "file") {
        const [, file] = message;
        session.files.push(file);
        return EMPTY;
      }
      if (type === "start") {
        const [, key, initialization] = message;
        assert(
          typeof getBox(session.box) !== "number",
          "exected running state (start)",
        );
        assert(!session.tracks.has(key), "duplicate (ongoing) track");
        assert(!session.traces.has(key), "duplicate (stopped) track");
        session.tracks.set(key, createStoredTrack(initialization));
        return EMPTY;
      }
      if (type === "stop") {
        const [, key, termination] = message;
        assert(
          typeof getBox(session.box) !== "number",
          "exected running state (stop)",
        );
        assert(session.tracks.has(key), "missing track");
        assert(
          isStoredTrack(session.tracks.get(key)),
          "expected a stored track",
        );
        return [
          storeTrack(
            take(session.tracks, key),
            {
              files: session.files,
              configuration: getBox(session.box),
            },
            termination,
          ),
        ];
      }
      if (type === "initialize") {
        const [, configuration] = message;
        assert(getBox(session.box) === INITIAL_STATE, "expected initial state");
        setBox(session.box, configuration);
        return EMPTY;
      }
      if (type === "terminate") {
        const [, termination] = message;
        return terminateSession(session, termination);
      }
      /* c8 ignore start */
      assert(false, "invalid message");
      /* c8 ignore stop */
    },
    closeSession: (session) =>
      terminateSession(session, {
        errors: [{ name: "AppmapError", message: "client disconnection" }],
        status: 1,
      }),
  };
};
