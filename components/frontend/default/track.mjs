import Message from "./message.mjs";

const BEGIN_STATE = 0;
const ENABLED_STATE = 1;
const DISABLED_STATE = 2;
const END_STATE = 3;

export default (dependencies) => {
  const {
    assert: { assert },
    util: { createBox, setBox, getBox },
  } = dependencies;
  const { messageTrack } = Message(dependencies);
  return {
    createTrack: (index, options) => ({
      index,
      state: createBox(BEGIN_STATE),
      options,
    }),
    controlTrack: (session, { index, state, options }, type) => {
      if (type === "start") {
        assert(
          getBox(state) === BEGIN_STATE,
          "track %j has already been initialized",
          index,
        );
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type, index, options });
      }
      if (type === "stop") {
        assert(
          getBox(state) !== BEGIN_STATE,
          "track %j has not yet been started",
          index,
        );
        assert(
          getBox(state) !== END_STATE,
          "track %j has already been stopped",
          index,
        );
        setBox(state, END_STATE);
        return messageTrack(session, {
          type,
          index,
        });
      }
      if (type === "play") {
        assert(
          getBox(state) === DISABLED_STATE,
          "track %j is not paused",
          index,
        );
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type, index });
      }
      if (type === "pause") {
        assert(
          getBox(state) === ENABLED_STATE,
          "track %j is not running",
          index,
        );
        setBox(state, DISABLED_STATE);
        return messageTrack(session, { type, index });
      }
      assert(false, "invalid track control: %s", type);
    },
  };
};
