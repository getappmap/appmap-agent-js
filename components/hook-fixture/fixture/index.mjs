export default (dependencies) => {
  const {
    url: { appendURLSegment },
    configuration: { createConfiguration, extendConfiguration },
    agent: {
      stopTrack,
      startTrack,
      openAgent,
      takeLocalAgentTrace,
      closeAgent,
    },
  } = dependencies;
  return {
    makeEvent: (type, index, time, data_type, data_rest) => ({
      type,
      index,
      time,
      data: {
        type: data_type,
        ...data_rest,
      },
    }),
    testHookAsync: async ({ hook, unhook }, config, callbackAsync) => {
      const url = appendURLSegment(import.meta.url, "..");
      const configuration = extendConfiguration(
        createConfiguration(url),
        { ...config },
        url,
      );
      const agent = openAgent(configuration);
      const hooking = hook(agent, configuration);
      try {
        startTrack(agent, "record", { data: {}, path: null });
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
