const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { logInfo } from "../../log/index.mjs";
import { hook } from "../../hook/index.mjs";
import {
  isConfigurationEnabled,
  extendConfigurationNode,
} from "../../configuration-accessor/index.mjs";
import { openAgent, recordStartTrack } from "../../agent/index.mjs";

export const main = (process, configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  const enabled = isConfigurationEnabled(configuration);
  if (enabled) {
    logInfo(
      "Recording the entire process #%j -- %j",
      process.pid,
      process.argv,
    );
    const agent = openAgent(configuration);
    hook(agent, configuration);
    recordStartTrack(agent, "process", {}, null);
  } else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  }
};
