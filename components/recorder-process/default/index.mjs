export default (dependencies) => {
  const {
    util: { assert },
    agent: {
      openAgent,
      promiseAgentTermination,
      closeAgent,
      createTrack,
      startTrack,
      stopTrack,
    },
  } = dependencies;
  return {
    mainAsync: (process, configuration) => {
      const { recorder } = configuration;
      assert(recorder === "process", "expected process recorder");
      const agent = openAgent(configuration);
      const promise = promiseAgentTermination(agent);
      const track = createTrack(agent);
      startTrack(agent, track, { path: null, options: {} });
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        const termination = { errors, status };
        stopTrack(agent, track, termination);
        closeAgent(agent, termination);
      });
      return promise;
    },
  };
};
