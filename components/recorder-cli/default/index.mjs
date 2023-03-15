import { InternalAppmapError } from "../../error/index.mjs";
import { record as recordProcess } from "./process.mjs";
import { record as recordRemote } from "./remote.mjs";
import { record as recordMocha } from "./mocha.mjs";
import { record as recordJest } from "./jest.mjs";

export const record = (configuration) => {
  /* c8 ignore start */
  if (configuration.recorder === "process") {
    recordProcess(configuration);
  } else if (configuration.recorder === "remote") {
    recordRemote(configuration);
  } else if (configuration.recorder === "mocha") {
    recordMocha(configuration);
  } else if (configuration.recorder === "jest") {
    recordJest(configuration);
  } else {
    throw new InternalAppmapError("invalid recorder configuration property");
  }
  /* c8 ignore stop */
};
