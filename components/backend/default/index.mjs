import Session from "./session.mjs";

const _Map = Map;
const _Set = Set;
const _String = String;

export default (dependencies) => {
  const {
    util: { assert, getDirectory, getBasename, getExtension },
  } = dependencies;
  const {
    openSession,
    closeSession,
    respondSession,
    sendSession,
    isEmptySession,
  } = Session(dependencies);
  const preventConflict = (storables, paths) => {
    // avoid arrow creation for the vast majority of events
    if (storables.length === 0) {
      return storables;
    }
    return storables.map(({ path, data }) => {
      if (paths.has(path)) {
        const directory = getDirectory(path);
        const basename = getBasename(path);
        const extension = getExtension(path);
        let counter = 0;
        do {
          counter += 1;
          path = `${directory}/${basename}-${_String(counter)}.${extension}`;
        } while (paths.has(path));
      }
      paths.add(path);
      return { path, data };
    });
  };
  return {
    createBackend: () => ({
      paths: new _Set(),
      sessions: new _Map(),
    }),
    openBackendSession: ({ sessions }, key) => {
      assert(!sessions.has(key), "duplicate backend session for opening");
      sessions.set(key, openSession());
    },
    closeBackendSession: ({ sessions, paths }, key) => {
      assert(sessions.has(key), "missing backend session for closing");
      const session = sessions.get(key);
      const storables = closeSession(session, key);
      if (isEmptySession(session)) {
        sessions.delete(key);
      }
      return preventConflict(storables, paths);
    },
    sendBackend: ({ sessions, paths }, key, message) => {
      assert(sessions.has(key), "missing backend session for sending message");
      return preventConflict(sendSession(sessions.get(key), message), paths);
    },
    respondBackend: ({ sessions }, method, path, body) => {
      const parts = /^\/([^/]+)(.*)/u.exec(path);
      if (parts === null) {
        return { code: 400, message: "missing session segment", body: null };
      }
      let [, segment, rest] = parts;
      if (segment === "_appmap") {
        if (sessions.size === 0) {
          return {
            code: 404,
            message: "not active backend session found",
            body: null,
          };
        }
        if (sessions.size > 1) {
          return {
            code: 409,
            message: "multiple active backend session found",
            body: null,
          };
        }
        segment = sessions.keys().next().value;
      } else if (!sessions.has(segment)) {
        return { code: 404, message: "backend session not found", body: null };
      }
      const session = sessions.get(segment);
      const response = respondSession(session, method, rest, body);
      if (isEmptySession(session)) {
        sessions.delete(segment);
      }
      return response;
    },
  };
};
