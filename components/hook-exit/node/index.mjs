import process from "node:process";
import { recordStopTrack } from "../../frontend/index.mjs";

export const hook = (frontend, _configuration) => {
  const listener = (status) => {
    recordStopTrack(frontend, null, { type: "exit", status });
  };
  process.addListener("beforeExit", listener);
  process.addListener("exit", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("beforeExit", listener);
  process.removeListener("exit", listener);
};
