export default (dependencies) => {
  const {
    util: { assert },
    url: { appendURLSegment },
    configuration: { createConfiguration, extendConfiguration },
    agent: {
      recordStopTrack,
      recordStartTrack,
      openAgent,
      takeLocalAgentTrace,
      closeAgent,
    },
  } = dependencies;
  return {
    testHookAsync: async ({ hook, unhook }, options, callbackAsync) => {
      options = {
        configuration: {},
        url: null,
        ...options,
      };
      const configuration = extendConfiguration(
        createConfiguration(appendURLSegment(import.meta.url, "..")),
        options.configuration,
        options.url,
      );
      const agent = openAgent(configuration);
      const hooking = hook(agent, configuration);
      try {
        recordStartTrack(agent, "record", {}, null);
        await callbackAsync();
        recordStopTrack(agent, "record", 0);
        const trace = takeLocalAgentTrace(agent, "record");
        assert(trace[0].type === "start", "expected stop as first message");
        assert(
          trace[trace.length - 1].type === "stop",
          "expected stop as last message",
        );
        return trace.slice(1, -1);
      } finally {
        closeAgent(agent);
        unhook(hooking);
      }
    },
  };
};
