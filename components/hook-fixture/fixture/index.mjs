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
        stopTrack(agent, "record", { status: 0, errors: [] });
        const { sources, events } = takeLocalAgentTrace(agent, "record");
        return { sources, events };
      } finally {
        closeAgent(agent);
        unhook(hooking);
      }
    },
  };
};
