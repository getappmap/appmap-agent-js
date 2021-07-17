
import {sendSession} from "./session.mjs"

const ENABLED_STATE = 0;
const DISABLED_STATE = 1;
const CLOSED_STATE = 2;

export default = (dependencies) => {
  const {expect:{expect}, util:{createBox, setBox, getBox}} = dependencies;
  const {messageControl} = Messaging(dependencies);
  return {
    openTrack: (messaging, index, options) => {
      messageControl(messaging, {type:"open", index, options});
      return {
        index,
        state: createBox(ENABLED_STATE)
      };
    },
    closeTrack: (messaging, {index, state}) => {
      expect(getBox(state) !== CLOSED_STATE, "cannot close track because it is already closed");
      messageControl(messaging, {
        type: "close",
        index,
      });
      setBox(state, CLOSED_STATE);
    },
    enableTrack: (messaging, {index, state}) => {
      expect(getBox(state) === DISABLED_STATE, "cannot enable track because it is not disabled", index);
      setBox(state, ENABLED_STATE);
      return messageControl(
        messaging,
        {type:"enable", index},
      );
    },
    disableTrack: (messaging, {index, state}) => {
      expect(getBox(state) === ENABLED_STATE, "cannot play track because it is not paused", index);
      setBox(state, DISABLED_STATE);
      return messageControl(
        messaging,
        {type:"pause", index},
      );
    },
  };
};
