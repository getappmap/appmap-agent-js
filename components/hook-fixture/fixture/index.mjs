import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
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
    recordStartTrack(agent, "record", {}, null);
    await callbackAsync();
    // TODO this completely breaks encapsulation
    //      but hook-fixture is only used for testing...
    if (agent.emitter.backend.tracks.has("record")) {
      recordStopTrack(agent, "record", { type: "manual" });
    }
    const trace = takeLocalAgentTrace(agent, "record");
    assert(
      trace[0].type === "start",
      "expected start as first message",
      InternalAppmapError,
    );
    assert(
      trace[trace.length - 1].type === "stop",
      "expected stop as last message",
      InternalAppmapError,
    );
    return trace.slice(1, -1);
  } finally {
    closeAgent(agent);
    unhook(hooking);
  }
};
