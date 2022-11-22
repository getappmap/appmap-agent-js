const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import process from "node:process";

const { recordError } = await import(`../../agent/index.mjs${__search}`);

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
