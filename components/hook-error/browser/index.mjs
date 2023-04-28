import { recordError } from "../../frontend/index.mjs";

const { window } = globalThis;

export const hook = (frontend, _configuration) => {
  const listener = (error) => {
    recordError(frontend, error);
  };
  window.addEventListener("error", listener);
  return listener;
};

export const unhook = (listener) => {
  window.removeEventListener("error", listener);
};
