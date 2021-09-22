export default (dependencies) => {
  const {
    uuid: { getUUID },
    util: { assert },
    agent: {
      openAgent,
      promiseAgentTermination,
      closeAgent,
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
      const track = getUUID();
      startTrack(agent, track, { path: null, data: {} });
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
