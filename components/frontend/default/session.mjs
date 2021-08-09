const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

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
  return {
    createSession: (configuration) => ({
      configuration,
      state: createBox(BEGIN_STATE),
    }),
    initializeSession: ({ configuration, state }) => {
      assert(
        getBox(state) === BEGIN_STATE,
        "sessios was expected to be non-initialized",
      );
      setBox(state, RUN_STATE);
      return {
        type: "initialize",
        data: configuration,
      };
    },
    terminateSession: ({ state }, { errors, status }) => {
      assert(
        getBox(state) === RUN_STATE,
        "session was expected to be running (either it not yet initialized or it has already been terminated)",
      );
      setBox(state, END_STATE);
      return {
        type: "terminate",
        data: { errors: errors.map(serializeError), status },
      };
    },
    sendSession: ({ state }, message) => {
      if (getBox(state) === RUN_STATE) {
        return {
          type: "trace",
          data: message,
        };
      }
      logWarning("message lost: %j", message);
      return null;
    },
  };
};
