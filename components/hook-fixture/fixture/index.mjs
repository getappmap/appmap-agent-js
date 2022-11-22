const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { InternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { assert } = await import(`../../util/index.mjs${__search}`);
const { createConfiguration, extendConfiguration } = await import(
  `../../configuration/index.mjs${__search}`
);
const {
  recordStopTrack,
  recordStartTrack,
  openAgent,
  takeLocalAgentTrace,
  closeAgent,
} = await import(`../../agent/index.mjs${__search}`);

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
    recordStopTrack(agent, "record", { type: "manual" });
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
