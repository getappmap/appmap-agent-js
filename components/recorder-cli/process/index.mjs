import process from "node:process";
import { hook } from "../../hook/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import {
  extendConfigurationNode,
  isConfigurationEnabled,
} from "../../configuration-accessor/index.mjs";
import { openAgent, getSession, recordStartTrack } from "../../agent/index.mjs";

export const record = (configuration) => {
  configuration = extendConfigurationNode(configuration, process);
  if (isConfigurationEnabled(configuration)) {
    logInfo(
      "Recording the entire process #%j -- %j",
      process.pid,
      process.argv,
    );
    const agent = openAgent(configuration);
    hook(agent, configuration);
    recordStartTrack(
      agent,
      `process-${getUuid()}`,
      extendConfiguration(configuration, { sessions: getSession(agent) }, null),
    );
  } /* c8 ignore start */ else {
    logInfo("Not recording process #%j -- %j", process.pid, process.argv);
  } /* c8 ignore stop */
};
