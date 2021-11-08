export default (dependencies) => {
  const {
    uuid: { getUUID },
    log: { logInfo },
    configuration: { isConfigurationEnabled, extendProcessConfiguration },
    util: { assert },
    agent: { openAgent, closeAgent, startTrack, stopTrack },
  } = dependencies;
  return {
    createMochaHooks: (process, configuration) => {
      logInfo("Recorder 'mocha' caught process %j", process.pid);
      configuration = extendProcessConfiguration(configuration, process);
      const { recorder } = configuration;
      assert(recorder === "mocha", "expected mocha recorder");
      if (!isConfigurationEnabled(configuration)) {
        return {};
      }
      const agent = openAgent(configuration);
      const errors = [];
      process.on("uncaughtExceptionMonitor", (error) => {
        errors.push(error);
      });
      process.on("exit", (status, signal) => {
        const termination = { errors, status };
        /* c8 ignore start */
        if (track !== null) {
          stopTrack(agent, track, termination);
        }
        /* c8 ignore stop */
        closeAgent(agent);
      });
      let track = null;
      return {
        beforeEach() {
          assert(track === null, "unexpected mocha concurrent test cases");
          track = getUUID();
          startTrack(agent, track, {
            path: null,
            data: {
              name: this.currentTest.parent.fullTitle(),
            },
          });
        },
        afterEach() {
          assert(track !== null, "mocha invoked afterEach ");
          stopTrack(agent, track, { errors: [], status: 0 });
          track = null;
        },
      };
    },
  };
};
