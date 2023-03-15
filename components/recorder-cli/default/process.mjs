import { hook } from "../../hook/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { logInfo } from "../../log/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { openAgent, getSession, recordStartTrack } from "../../agent/index.mjs";

export const record = (process, configuration) => {
  logInfo("Recording the entire process #%j -- %j", process.pid, process.argv);
  const agent = openAgent(configuration);
  hook(agent, configuration);
  recordStartTrack(
    agent,
    `process-${getUuid()}`,
    extendConfiguration(configuration, { sessions: getSession(agent) }, null),
  );
};
