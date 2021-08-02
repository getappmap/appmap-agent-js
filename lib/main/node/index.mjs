import { readFileSync } from "fs";
import YAML from "yaml";

const { parse } = YAML;

export default (dependencies) => {
  const {
    assert: { assert },
    log: { logInfo },
    specifier: { matchSpecifier },
    configuration: {
      createConfiguration,
      extendConfiguration,
      extractEnvironmentConfiguration,
    },
    agent: {
      transformSourceDefault,
      createAgent,
      getCurrentTransformSource,
      executeAgentAsync,
      interruptAgent,
      createTrack,
      controlTrack,
    },
  } = dependencies;
  return {
    main: (process) => {
      const { cwd, env, argv } = process;
      assert(argv.length > 1, "too few argv: %j", argv);
      const { [1]: argv1 } = argv;
      const configuration = extendConfiguration(
        extendConfiguration(
          createConfiguration(cwd()),
          parse(readFileSync(`${cwd()}/.appmap.yml`, "utf8")),
          cwd(),
        ),
        extractEnvironmentConfiguration(env),
        cwd(),
      );
      const { enabled } = configuration;
      for (const [specifier, boolean] of enabled) {
        if (matchSpecifier(specifier, argv1)) {
          if (!boolean) {
            break;
          }
          const agent = createAgent(configuration);
          const promise = executeAgentAsync(agent);
          const track = createTrack(agent, { recorder: "normal" });
          controlTrack(agent, track, "start");
          const errors = [];
          process.on("uncaughtExceptionMonitor", (error) => {
            errors.push(error);
          });
          process.on("exit", (status, signal) => {
            controlTrack(agent, track, "stop");
            interruptAgent(agent, { errors, status });
          });
          return {
            promise,
            transformSource: (...args) => {
              const transformSource = getCurrentTransformSource(agent);
              return transformSource(...args);
            },
          };
        }
      }
      logInfo("bypassing %o because it is disabled by %o", argv1, enabled);
      return {
        promise: Promise.resolve(null),
        transformSource: transformSourceDefault,
      };
    },
  };
};
