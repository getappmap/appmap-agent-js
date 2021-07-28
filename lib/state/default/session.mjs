const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { createBox, getBox, setBox },
  } = dependencies;
  return {
    createSession: (uuid, configuration) => ({
      configuration,
      uuid,
      state: createBox(BEGIN_STATE),
    }),
    initializeSession: ({ state, uuid, configuration }) => {
      assert(
        getBox(state) === BEGIN_STATE,
        "session %s was expected to be non-initialized",
        uuid,
      );
      setBox(state, RUN_STATE);
      return {
        type: "initialize",
        session: uuid,
        configuration,
      };
    },
    terminateSession: ({ state, uuid }, reason) => {
      assert(
        getBox(state) === RUN_STATE,
        "session %s was expected to be initialized",
        uuid,
      );
      setBox(state, END_STATE);
      return {
        type: "terminate",
        session: uuid,
        reason,
      };
    },
    sendSession: ({ state, uuid }, data) => {
      assert(
        getBox(state) === RUN_STATE,
        "session %s was expected to be initialized",
        uuid,
      );
      return {
        type: "send",
        session: uuid,
        data,
      };
    },
  };
};
