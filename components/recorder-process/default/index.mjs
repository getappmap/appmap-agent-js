export default (dependencies) => {
  const {
    util: { assert },
    agent: {
      createAgent,
      executeAgentAsync,
      createTrack,
      startTrack,
      stopTrack,
      interruptAgent,
    },
  } = dependencies;
  return {
    mainAsync: (process, configuration) => {
      const { recorder } = configuration;
      assert(recorder === "process", "expected process recorder");
      const agent = createAgent(configuration);
      const promise = executeAgentAsync(agent);
      const track = createTrack(agent);
      startTrack(agent, track, { path: null, options: {} });
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        const termination = { errors, status };
        stopTrack(agent, track, termination);
        interruptAgent(agent, termination);
      });
      return promise;
    },
  };
};
