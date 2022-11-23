const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import process from "node:process";

import { recordError } from "../../agent/index.mjs";

export const hook = (agent, _configuration) => {
  const listener = (error) => {
    recordError(agent, error);
  };
  process.addListener("uncaughtExceptionMonitor", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("uncaughtExceptionMonitor", listener);
};
