import { hook } from "../../hook/index.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { openAgent, recordStartTrack } from "../../agent/index.mjs";

export const record = (configuration) => {
  const agent = openAgent(configuration);
  hook(agent, configuration);
  recordStartTrack(agent, `process-${getUuid()}`, configuration);
};
