import Message from "./message.mjs";

const BEGIN_STATE = 0;
const ENABLED_STATE = 1;
const DISABLED_STATE = 2;
const END_STATE = 3;

export default (dependencies) => {
  const {
    util: { assert, createBox, setBox, getBox },
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
          "track has already been initialized",
        );
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type, index, options });
      }
      if (type === "stop") {
        assert(getBox(state) !== BEGIN_STATE, "track has not yet been started");
        assert(getBox(state) !== END_STATE, "track has already been stopped");
        setBox(state, END_STATE);
        return messageTrack(session, {
          type,
          index,
        });
      }
      if (type === "play") {
        assert(getBox(state) === DISABLED_STATE, "track is not paused");
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type, index });
      }
      if (type === "pause") {
        assert(getBox(state) === ENABLED_STATE, "track is not running");
        setBox(state, DISABLED_STATE);
        return messageTrack(session, { type, index });
      }
      assert(false, "invalid track control: %s", type);
    },
  };
};
