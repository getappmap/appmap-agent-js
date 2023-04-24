import { recordStopTrack } from "../../frontend/index.mjs";

const { window } = globalThis;

export const hook = (frontend, _configuration) => {
  const listener = () => {
    recordStopTrack(frontend, null, { type: "exit", status: 0 });
  };
  window.addEventListener("beforeunload", listener);
  return listener;
};

export const unhook = (listener) => {
  window.removeEventListener("beforeunload", listener);
};
