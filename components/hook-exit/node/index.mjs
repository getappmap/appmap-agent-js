const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import process from "node:process";

const { recordStopTrack } = await import(`../../agent/index.mjs${__search}`);

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
