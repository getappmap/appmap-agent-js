export default (dependencies) => {
  const {
    expect: { expect },
    log: { logInfo },
    specifier: { matchSpecifier },
    configuration: { extendConfiguration },
    agent: {
      createAgent,
      executeAgentAsync,
      createTrack,
      controlTrack,
      interruptAgent,
    },
  } = dependencies;
  const isEnabled = ({ enabled, main }) => {
    for (const [specifier, boolean] of enabled) {
      if (matchSpecifier(specifier, main)) {
        return boolean;
      }
    }
    return false;
  };
  return {
    mainAsync: (process, configuration) => {
      const { recorder } = configuration;
      expect(
        recorder === "process",
        "expected recorder to be 'process', got: %j",
        recorder,
      );
      const { cwd, argv } = process;
      const { length } = argv;
      expect(length > 1, "cannot extract main file from argv: %j", argv);
      const { [1]: main } = argv;
      configuration = extendConfiguration(configuration, { main }, cwd());
      if (!isEnabled(configuration)) {
        logInfo("bypassing %j", main);
        return Promise.resolve(null);
      }
      logInfo("intercepting %s", main);
      const agent = createAgent(configuration);
      const promise = executeAgentAsync(agent);
      const track = createTrack(agent, {});
      controlTrack(agent, track, "start");
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        controlTrack(agent, track, "stop");
        interruptAgent(agent, { errors, status });
      });
      return promise;
    },
  };
};
