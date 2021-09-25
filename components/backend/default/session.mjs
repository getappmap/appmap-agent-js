import Track from "./track.mjs";

const _Map = Map;
const _Set = Set;
const { assign } = Object;

const INITIAL_STATE = 0;
const RUNNING_STATE = 1;
const TERMINATED_STATE = 2;
const CLOSED_STATE = 3;

const EMPTY = [];

const PROTOTYPE = {
  __proto__: null,
  storables: [],
  code: 200,
  message: null,
  body: null,
};

const MESSAGES = new _Map([
  [INITIAL_STATE, "not yet initialized"],
  [TERMINATED_STATE, "already terminated"],
  [CLOSED_STATE, "already closed"],
]);

export default (dependencies) => {
  const {
    util: { assert, createBox, setBox, getBox },
    log: { logDebug },
    "validate-message": { validateMessage },
  } = dependencies;
  const { createTrack, compileTrack } = Track(dependencies);
  const finalizeSession = (session, termination) => {
    const storables = [];
    for (const [key, track] of session.tracks) {
      const { path, data } = compileTrack(track, session.files, termination);
      if (path === null) {
        session.traces.set(key, data);
      } else {
        storables.push({ path, data });
      }
    }
    session.tracks.clear();
    return storables;
  };
  const take = (map, key) => {
    const value = map.get(key);
    map.delete(key);
    return value;
  };
  return {
    isEmptySession: ({ state, traces }) =>
      getBox(state) === CLOSED_STATE && traces.size === 0,
    openSession: () => ({
      files: [],
      paths: new _Set(),
      tracks: new _Map(),
      traces: new _Map(),
      configuration: {},
      state: createBox(INITIAL_STATE),
    }),
    respondSession: (session, method, path, body) => {
      const parts = /^\/([^/]+)$/u.exec(path);
      if (parts === null) {
        return {
          __proto__: PROTOTYPE,
          code: 400,
          message: "malformed url: missing track segment",
        };
      }
      const [, segment] = parts;
      if (method === "POST") {
        const state = getBox(session.state);
        if (MESSAGES.has(state)) {
          return {
            __proto__: PROTOTYPE,
            code: 409,
            message: MESSAGES.get(state),
          };
        }
        assert(state === RUNNING_STATE, "expected running state");
        if (session.tracks.has(segment) || session.traces.has(segment)) {
          return {
            __proto__: PROTOTYPE,
            code: 409,
            message: "duplicate track",
          };
        }
        session.tracks.set(
          segment,
          createTrack(session.configuration, {
            path: null,
            data: { output: null },
            ...body,
          }),
        );
        return {
          __proto__: PROTOTYPE,
          code: 200,
        };
      }
      if (method === "GET") {
        return {
          __proto__: PROTOTYPE,
          code: 200,
          body: {
            enabled: session.tracks.has(segment),
          },
        };
      }
      if (method === "DELETE") {
        if (session.traces.has(segment)) {
          return {
            __proto__: PROTOTYPE,
            code: 200,
            body: take(session.traces, segment),
          };
        }
        if (session.tracks.has(segment)) {
          assert(
            getBox(session.state) === RUNNING_STATE,
            "expected running state",
          );
          const { path, data } = compileTrack(
            take(session.tracks, segment),
            session.files,
            { errors: [], status: 0, ...body },
          );
          if (path === null) {
            return {
              __proto__: PROTOTYPE,
              code: 200,
              body: data,
            };
          }
          return {
            __proto__: PROTOTYPE,
            code: 200,
            storables: [{ path, data }],
          };
        }
        return {
          __proto__: PROTOTYPE,
          code: 404,
          message: "missing trace",
        };
      }
      return {
        storables: EMPTY,
        code: 400,
        message: "unsupported method",
        body: null,
      };
    },
    sendSession: (session, message) => {
      logDebug("session received: %j", message);
      validateMessage(message);
      const type = message[0];
      assert(
        getBox(session.state) ===
          (type === "initialize" ? INITIAL_STATE : RUNNING_STATE),
        "invalid state",
      );
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
        assert(!session.tracks.has(key), "duplicate (ongoing) track");
        assert(!session.traces.has(key), "duplicate (stopped) track");
        session.tracks.set(
          key,
          createTrack(session.configuration, initialization),
        );
        return EMPTY;
      }
      if (type === "stop") {
        const [, key, termination] = message;
        assert(session.tracks.has(key), "missing track");
        const { path, data } = compileTrack(
          take(session.tracks, key),
          session.files,
          termination,
        );
        if (path !== null) {
          return [{ path, data }];
        }
        session.traces.set(key, data);
        return EMPTY;
      }
      if (type === "initialize") {
        const [, configuration] = message;
        setBox(session.state, RUNNING_STATE);
        assign(session.configuration, configuration);
        return EMPTY;
      }
      if (type === "terminate") {
        const [, termination] = message;
        setBox(session.state, TERMINATED_STATE);
        return finalizeSession(session, termination);
      }
      /* c8 ignore start */
      assert(false, "invalid message");
      /* c8 ignore stop */
    },
    closeSession: (session) => {
      assert(
        getBox(session.state) !== CLOSED_STATE,
        "duplicate session closing",
      );
      setBox(session.state, CLOSED_STATE);
      return finalizeSession(session, {
        errors: [{ name: "AppmapError", message: "client disconnection" }],
        status: 1,
      });
    },
  };
};
