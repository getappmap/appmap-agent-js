export default (dependencies) => {
  const {
    util: { assert },
    agent: { openAgent, promiseAgentTermination, closeAgent },
  } = dependencies;
  return {
    mainAsync: (process, configuration) => {
      const { recorder } = configuration;
      assert(recorder === "empty", "expected empty recorder");
      const agent = openAgent(configuration);
      const promise = promiseAgentTermination(agent);
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        closeAgent(agent, { errors, status });
      });
      return promise;
    },
  };
};
