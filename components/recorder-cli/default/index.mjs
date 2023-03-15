import { InternalAppmapError } from "../../error/index.mjs";
import { logInfo } from "../../log/index.mjs";
import {
  isConfigurationEnabled,
  extendConfigurationNode,
} from "../../configuration-accessor/index.mjs";
import { record as recordProcess } from "./process.mjs";
import { record as recordRemote } from "./remote.mjs";
import { record as recordMocha } from "./mocha.mjs";
import { record as recordJest } from "./jest.mjs";

export const record = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (isConfigurationEnabled(configuration)) {
    /* c8 ignore start */
    if (configuration.recorder === "process") {
      recordProcess(process, configuration);
    } else if (configuration.recorder === "remote") {
      recordRemote(process, configuration);
    } else if (configuration.recorder === "mocha") {
      recordMocha(process, configuration);
    } else if (configuration.recorder === "jest") {
      recordJest(process, configuration);
    } else {
      throw new InternalAppmapError("invalid recorder configuration field");
    }
    /* c8 ignore stop */
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  }
};
