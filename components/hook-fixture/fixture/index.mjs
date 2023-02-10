import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  recordStopTrack,
  recordStartTrack,
  openAgent,
  takeLocalAgentTrace,
  closeAgent,
} from "../../agent/index.mjs";

const isCore = ({ type }) => type !== "stop";

export const testHookAsync = async (
  { hook, unhook },
  options,
  callbackAsync,
) => {
  options = {
    configuration: {},
    url: null,
    ...options,
  };
  const configuration = extendConfiguration(
    createConfiguration(import.meta.url),
    options.configuration,
    options.url,
  );
  const agent = openAgent(configuration);
  const hooking = hook(agent, configuration);
  try {
    recordStartTrack(agent, "record", configuration);
    await callbackAsync();
    recordStopTrack(agent, "record", { type: "manual" });
    return takeLocalAgentTrace(agent, "record").messages.filter(isCore);
  } finally {
    closeAgent(agent);
    unhook(hooking);
  }
};
