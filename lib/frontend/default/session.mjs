
const BEGIN_STATE = 0;
const RUN_STATE = 1;
const END_STATE = 2;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { createBox, getBox, setBox },
  } = dependencies;
  return {
    createSession: (uuid, options) => ({
      options,
      uuid,
      state: createBox(STATE0),
    }),
    initializeSession: ({state, uuid, options}) => {
      expect(getBox(state) === BEGIN_STATE, "session %s was expected to be non-initialized");
      setBox(state, STATE1);
      return {
        type: "initialize",
        uuid,
        options,
      };
    },
    terminateSession: ({state, uuid}, reason) => {
      expect(getBox(state) === RUN_STATE, "session %s was expected to be initialized", uuid);
      setBox(state, END_STATE);
      return {
        type: "terminate",
        session: uuid,
        reason,
      };
    },
    sendSession: ({state, uuid}, data) => {
      expect(getBox(state) === RUN_STATE, "session %s was expected to be initialized", uuid);
      return {
        type: "send",
        session: uuid,
        data,
      };
    },
  };
};
