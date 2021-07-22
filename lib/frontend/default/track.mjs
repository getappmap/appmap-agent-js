import Message from "./message.mjs";

const BEGIN_STATE = 0;
const ENABLED_STATE = 1;
const DISABLED_STATE = 2;
const END_STATE = 3;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { createBox, setBox, getBox },
  } = dependencies;
  const { messageTrack } = Message(dependencies);
  return {
    createTrack: (index, options) => ({
      index,
      state: createBox(BEGIN_STATE),
      options,
    }),
    startTrack: ({ session }, { index, state, options }) => {
      expect(
        getBox(state) === BEGIN_STATE,
        "track %j has already been initialized",
        index,
      );
      setBox(state, ENABLED_STATE);
      return messageTrack(session, { type: "start", track: index, options });
    },
    stopTrack: ({ session }, { index, state }) => {
      expect(
        getBox(state) !== BEGIN_STATE,
        "track %j has not yet been started",
        index,
      );
      expect(
        getBox(state) !== END_STATE,
        "track %j has already been stopped",
        index,
      );
      setBox(state, END_STATE);
      return messageTrack(session, {
        type: "stop",
        track: index,
      });
    },
    playTrack: ({ session }, { index, state }) => {
      expect(getBox(state) === DISABLED_STATE, "track %j is not paused", index);
      setBox(state, ENABLED_STATE);
      return messageTrack(session, { type: "play", track: index });
    },
    pauseTrack: ({ session }, { index, state }) => {
      expect(getBox(state) === ENABLED_STATE, "track %j is not running", index);
      setBox(state, DISABLED_STATE);
      return messageTrack(session, { type: "pause", track: index });
    },
  };
};
