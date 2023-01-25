import process from "node:process";

import { recordStopTrack } from "../../agent/index.mjs";

export const hook = (agent, _configuration) => {
  const listener = (status) => {
    // When using `node:net` rather than `posix-socket`,
    // this will probably not get through because node
    // will exit synchronously after this event handler.
    // There is a `beforeExit` event but there is no
    // guarantees that the process will actually exit.
    recordStopTrack(agent, null, { type: "exit", status });
  };
  process.addListener("exit", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("exit", listener);
};
