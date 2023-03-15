import { recordError } from "../../agent/index.mjs";

const { window } = globalThis;

export const hook = (agent, _configuration) => {
  const listener = (error) => {
    recordError(agent, error);
  };
  window.addEventListener("error", listener);
  return listener;
};

export const unhook = (listener) => {
  window.removeEventListener("error", listener);
};
