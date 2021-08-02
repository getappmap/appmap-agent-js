const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { createBox, getBox, setBox },
  } = dependencies;
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
    terminateSession: ({ state }, termination) => {
      assert(
        getBox(state) === RUN_STATE,
        "session was expected to be initialized",
      );
      setBox(state, END_STATE);
      return {
        type: "terminate",
        data: termination,
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
