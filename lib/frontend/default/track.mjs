import Messaging from "./messaging.mjs";

const ENABLED_STATE = 0;
const DISABLED_STATE = 1;
const TERMINATED_STATE = 2;

export default (dependencies) => {
  const {
    expect: { expect },
    util: { createBox, setBox, getBox },
  } = dependencies;
  const { messageTrack } = Messaging(dependencies);
  return {
    initializeTrack: (messaging, index, options) => {
      messageTrack(messaging, { type: "initialize", track: index, options });
      return {
        index,
        state: createBox(ENABLED_STATE),
      };
    },
    terminateTrack: (messaging, { index, state }) => {
      expect(
        getBox(state) !== TERMINATED_STATE,
        "cannot close track because it is already closed",
      );
      messageTrack(messaging, {
        type: "terminate",
        track: index,
      });
      setBox(state, TERMINATED_STATE);
    },
    enableTrack: (messaging, { index, state }) => {
      expect(
        getBox(state) === DISABLED_STATE,
        "cannot enable track because it is not disabled",
        index,
      );
      setBox(state, ENABLED_STATE);
      return messageTrack(messaging, { type: "enable", track: index });
    },
    disableTrack: (messaging, { index, state }) => {
      expect(
        getBox(state) === ENABLED_STATE,
        "cannot disable track because it is not enabled",
        index,
      );
      setBox(state, DISABLED_STATE);
      return messageTrack(messaging, { type: "disable", track: index });
    },
  };
};
