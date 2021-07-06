
import {runScript} from "./script.mjs";
import {getCurrentGroup, startGrouping, stopGrouping} from "./grouping.mjs";
import {startHooking, stopHooking} = require("./hooking/index.mjs");

export default = (dependencies, options) => {
  options = {
    grouping: true,
    hooking: null,
    ... options
  };
  if (options.grouping) {
    return {
      runScript,
      getCurrentGroup,
      start: ({linkGroup, ...traps}) => {
        startGrouping(linkGroup);
        startHooking(traps, options.hooking);
      },
      stop: () => {
        stopHooking();
        stopGrouping();
      },
    };
  }
  return {
    runScript,
    getCurrentGroup: constant(0),
    start: (traps) => {
      startHooking(traps, options.hooking);
    },
    stop: stopHooking
  };
};
