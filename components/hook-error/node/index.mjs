import process from "node:process";
import { recordError } from "../../frontend/index.mjs";

export const hook = (frontend, _configuration) => {
  const listener = (error) => {
    recordError(frontend, error);
  };
  process.addListener("uncaughtExceptionMonitor", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("uncaughtExceptionMonitor", listener);
};
