export default (dependencies) => {
  const {
    uuid: { getUUID },
    expect: { expect },
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
          expect(
            error instanceof Error,
            "expected uncaught error to be an instance of Error, got: %o",
            error,
          );
          const { name, message, stack } = error;
          expect(
            typeof name === "string",
            "expected uncaught error's name to be a string, got: %o",
            name,
          );
          expect(
            typeof message === "string",
            "expected uncaught error's message to be a string, got: %o",
            message,
          );
          expect(
            typeof stack === "string",
            "expected uncaught error's stack to be a string, got: %o",
            stack,
          );
          errors.push({ name, message, stack });
        });
        process.on("exit", (status, signal) => {
          stopTrack(agent, track, { errors, status });
          closeAgent(agent);
        });
      }
    },
  };
};
