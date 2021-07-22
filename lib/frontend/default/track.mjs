import Messaging from "./messaging.mjs";

const BEGIN_STATE = 0;
const ENABLED_STATE = 1;
const DISABLED_STATE = 2;
const END_STATE = 3;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { createBox, setBox, getBox },
  } = dependencies;
  const { messageTrack } = Messaging(dependencies);
  return {
    createTrack: (index, options) => ({
      index,
      state: createBox(BEGIN_STATE),
    });
    startTrack: ({session}, {index, state, options}) => {
      expect(getBox(state), BEGIN_STATE);
      setBox(state, PLAY_STATE);
      return messageTrack(session, { type: "start", track: index, options });
    },
    stopTrack: ({session}, { index, state }) => {
      expect(
        getBox(state) === PLAY_STATE || getBox(state) === PAUSE_STATE,
        "expected track %j to be in play state or pause state",
      );
      messageTrack(session, {
        type: "stop",
        track: index,
      });
      setBox(state, END_STATE);
    },
    playTrack: ({session}, { index, state }) => {
      expect(
        getBox(state) === DISABLED_STATE,
        "cannot enable track because it is not disabled",
        index,
      );
      setBox(state, ENABLED_STATE);
      return messageTrack(session, { type: "play", track: index });
    },
    pauseTrack: ({session}, { index, state }) => {
      expect(
        getBox(state) === ENABLED_STATE,
        "cannot disable track because it is not enabled",
        index,
      );
      setBox(state, DISABLED_STATE);
      return messageTrack(session, { type: "pause", track: index });
    },
  };
};
