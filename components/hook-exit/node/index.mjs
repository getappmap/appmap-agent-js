import process from "node:process";
import { toInteger } from "../../util/index.mjs";
import { recordStopTrack } from "../../frontend/index.mjs";

const {
  Number: { isNaN },
} = globalThis;

const toStatus = (any) => {
  const integer = toInteger(any);
  if (isNaN(integer) || integer < 0 || integer > 255) {
    return 1;
  } else {
    return integer;
  }
};

export const hook = (frontend, _configuration) => {
  const listener = (status) => {
    recordStopTrack(frontend, null, {
      type: "exit",
      status: toStatus(status),
    });
  };
  process.addListener("beforeExit", listener);
  process.addListener("exit", listener);
  return listener;
};

export const unhook = (listener) => {
  process.removeListener("beforeExit", listener);
  process.removeListener("exit", listener);
};
