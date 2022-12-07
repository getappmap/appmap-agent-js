import process from "node:process";

import { recordStopTrack } from "../../agent/index.mjs";

export const hook = (agent, _configuration) => {
  const listener = (status) => {
    recordStopTrack(agent, null, { type: "exit", status });
  };
  process.addListener("exit", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("exit", listener);
};
