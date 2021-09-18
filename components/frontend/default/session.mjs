const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

const _Set = Set;
const _Error = Error;

export default (dependencies) => {
  const {
    util: { assert, createBox, getBox, setBox },
    expect: { expect },
    log: { logWarning },
  } = dependencies;
  const serializeError = (error) => {
    expect(
      error instanceof _Error,
      "expected an instance of Error but got %o",
      error,
    );
    const { name, message, stack } = error;
    return { name, message, stack };
  };
  const sendMessage = (state, message) => {
    if (getBox(state) === RUN_STATE) {
      return message;
    }
    logWarning("message lost: %j", message);
    return null;
  };
  return {
    createSession: (configuration) => ({
      configuration,
      tracks: new _Set(),
      state: createBox(BEGIN_STATE),
    }),
    initializeSession: ({ configuration, state }) => {
      assert(getBox(state) === BEGIN_STATE, "duplicate session initialization");
      setBox(state, RUN_STATE);
      return ["initialize", configuration];
    },
    terminateSession: ({ state }, { errors, status }) => {
      assert(getBox(state) === RUN_STATE, "missing session initialization");
      setBox(state, END_STATE);
      return ["terminate", { errors: errors.map(serializeError), status }];
    },
    recordEventSession: ({ state }, type1, index, time, type2, data) =>
      sendMessage(
        state,
        ["event", type1, index, time, type2, data], // array representation for performance reason
      ),
    registerFileSession: ({ state }, file) =>
      sendMessage(state, ["file", file]),
    startTrackSession: ({ state, tracks }, track, initialization) => {
      assert(!tracks.has(track), "duplicate track");
      tracks.add(track);
      return sendMessage(state, ["start", track, initialization]);
    },
    stopTrackSession: ({ state, tracks }, track, { errors, status }) => {
      assert(tracks.has(track), "missing track");
      tracks.delete(track);
      return sendMessage(state, [
        "stop",
        track,
        { errors: errors.map(serializeError), status },
      ]);
    },
  };
};
