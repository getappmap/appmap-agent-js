import { readFileSync } from "fs";
import { dirname } from "path";
import YAML from "yaml";

const { parse: parseJSON } = JSON;
const { parse: parseYAML } = YAML;
const _Promise = Promise;

export default (dependencies) => {
  const {
    assert: { assert, assertSuccess },
    util: { toAbsolutePath },
    log: { logInfo },
    specifier: { matchSpecifier },
    configuration: { createConfiguration, extendConfiguration },
    agent: {
      createAgent,
      executeAgentAsync,
      interruptAgent,
      createTrack,
      controlTrack,
    },
  } = dependencies;
  return {
    mainAsync: async (process) => {
      const { cwd, env, argv } = process;
      assert(argv.length > 1, "too few argv: %j", argv);
      const { [1]: argv1 } = argv;
      const {
        APPMAP_CONFIGURATION: configuration_string,
        APPMAP_REPOSITORY_DIRECTORY: preliminary_repository_directory,
        APPMAP_CONFIGURATION_PATH: preliminary_configuration_path,
      } = {
        APPMAP_CONFIGURATION: null,
        APPMAP_REPOSITORY_DIRECTORY: cwd(),
        APPMAP_CONFIGURATION_PATH: `${cwd()}/appmap.yml`,
        ...env,
      };
      let configuration;
      if (configuration_string === null) {
        configuration = createConfiguration(preliminary_repository_directory);
        const configuration_data = assertSuccess(
          () => parseYAML(readFileSync(preliminary_configuration_path, "utf8")),
          "failed to load configuration file %j >> %e",
          preliminary_configuration_path,
        );
        configuration = extendConfiguration(
          configuration,
          configuration_data,
          dirname(preliminary_configuration_path),
        );
      } else {
        configuration = parseJSON(configuration_string);
      }
      // configuration = extendConfiguration(
      //   extractEnvironmentConfiguration(env2),
      //   "/",
      // );
      const { enabled } = configuration;
      for (const [specifier, boolean] of enabled) {
        if (matchSpecifier(specifier, argv1)) {
          if (!boolean) {
            break;
          }
          const agent = createAgent(configuration);
          const promise = executeAgentAsync(agent);
          const track = createTrack(agent, {
            recorder: "process",
            main: toAbsolutePath(cwd(), argv1),
          });
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
        }
      }
      logInfo("bypassing %j because it is disabled by %j", argv1, enabled);
      return _Promise.resolve(null);
    },
  };
};
