const _Promise = Promise;
const _undefined = undefined;

export default (dependencies) => {
  const {
    uuid: { getUUID },
    util: { assert },
    configuration: { isConfigurationEnabled },
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
      if (!isConfigurationEnabled(configuration)) {
        return _Promise.resolve(_undefined);
      }
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
