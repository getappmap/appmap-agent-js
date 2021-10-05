export default (dependencies) => {
  const {
    uuid: { getUUID },
    util: { assert },
    configuration: { isConfigurationEnabled },
    agent: { openAgent, closeAgent, startTrack, stopTrack },
  } = dependencies;
  return {
    main: (process, configuration) => {
      const { recorder } = configuration;
      assert(recorder === "process", "expected process recorder");
      if (isConfigurationEnabled(configuration)) {
        const agent = openAgent(configuration);
        const track = getUUID();
        startTrack(agent, track, { path: null, data: {} });
        const errors = [];
        process.on("uncaughtExceptionMonitor", (error) => {
          errors.push(error);
        });
        process.on("exit", (status, signal) => {
          const termination = { errors, status };
          stopTrack(agent, track, termination);
          closeAgent(agent);
        });
      }
    },
  };
};
