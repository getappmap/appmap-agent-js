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
      logInfo(
        "Recording the entire process #%j -- %j",
        process.pid,
        process.argv,
      );
      recordProcess(configuration);
    } else if (configuration.recorder === "remote") {
      logInfo(
        "Enabling remote recording on process #%j -- %j",
        process.pid,
        process.argv,
      );
      logInfo(
        "Remote recording api documention: https://appmap.io/docs/reference/remote-recording-api.html",
      );
      recordRemote(configuration);
    } else if (configuration.recorder === "mocha") {
      logInfo(
        "Recording mocha test cases of process #%j -- %j",
        process.pid,
        process.argv,
      );
      recordMocha(configuration);
    } else if (configuration.recorder === "jest") {
      logInfo(
        "Recording jest test cases of process #%j -- %j",
        process.pid,
        process.argv,
      );
      recordJest(configuration);
    } else {
      throw new InternalAppmapError("invalid recorder configuration field");
    }
    /* c8 ignore stop */
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  }
};
