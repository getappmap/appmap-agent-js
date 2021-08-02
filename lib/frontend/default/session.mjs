const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

const _Error = Error;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { createBox, getBox, setBox },
  } = dependencies;
  const serializeError = (error) => {
    assert(
      error instanceof _Error,
      "expected an instance of Error but gort %o",
      error,
    );
    const { name, message } = error;
    return { name, message };
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
        "session was expected to be initialized",
      );
      setBox(state, END_STATE);
      return {
        type: "terminate",
        data: { errors: errors.map(serializeError), status },
      };
    },
    sendSession: ({ state }, message) => {
      assert(
        getBox(state) === RUN_STATE,
        "session was expected to be initialized",
      );
      return {
        type: "send",
        data: message,
      };
    },
  };
};
