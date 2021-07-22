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
    controlTrack: (session, {index, state, options}, type) => {
      if (type === "start") {
        expect(
          getBox(state) === BEGIN_STATE,
          "track %j has already been initialized",
          index,
        );
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type: "start", track: index, options });
      }
      if (type === "stop") {
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
      }
      if (type === "play") {
        expect(getBox(state) === DISABLED_STATE, "track %j is not paused", index);
        setBox(state, ENABLED_STATE);
        return messageTrack(session, { type: "play", track: index });
      }
      if (type === "pause") {
        expect(getBox(state) === ENABLED_STATE, "track %j is not running", index);
        setBox(state, DISABLED_STATE);
        return messageTrack(session, { type: "pause", track: index });
      }
      expect(false, "invalid track control: %s", type);
    },
  };
};
