
export default (dependencies) => {
  const {
    configuration: {createConfiguration, extendConfiguration},
    agent: {
      transformSourceDefault,
      createAgent,
      getCurrentTransformSource,
      executeAgentAsync,
      createTrack,
      controlTrack,
    },
  } = dependencies;
  return {
    main: (process) => {
      const {cwd, env, argv:[argv0, argv1]} = process;
      const configuration = extendConfiguration(
        extendConfiguration(
          createConfiguration(cwd()),
          parse(readFileSync("./.appmap.yml", "utf8")),
          cwd(),
        ),
        extractEnvironmentConfigurationData(env),
        cwd(),
      );
      const {enabled} = configuration;
      for (const [specifier, boolean] of enabled) {
        if (matchSpecifier(specifier, argv1) {
          const agent = createAgent(configuration);
          initializeAgent(agent);
          const track = createTrack(agent, {recorder:"normal"});
          controlTrack(agent, track, "start");
          const errors = [];
          process.on("uncaughtExceptionMonitor", (error) => {
            errors.push(error);
          });
          process.on("exit", (status, signal) => {
            controlTrack(agent, track, "stop");
            terminateAgent(agent, { errors, status });
          });
          return {
            promise: executeAgentAsync(agent),
            transformSource: (...args) => {
              transformSource = getCurrentTransformSource(agent);
              return transformSource(...args);
            },
          };
        }
      }
      logInfo("bypassing %o because it did not match against %o", argv1, enabled);
      return {
        promise: Promise.resolve(null),
        transformSource: transformSourceDefault,
      };
    },
  };
};
