import { readFileSync } from "fs";
import { dirname } from "path";
import YAML from "yaml";

const { parse: parseJSON } = JSON;
const { parse: parseYAML } = YAML;
const _Promise = Promise;

export default (dependencies) => {
  const {
    assert: { assert, assertSuccess },
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
        APPMAP_REPOSITORY_DIRECTORY: repository_directory,
        APPMAP_CONFIGURATION_PATH: configuration_path,
      } = {
        APPMAP_CONFIGURATION: null,
        APPMAP_REPOSITORY_DIRECTORY: cwd(),
        APPMAP_CONFIGURATION_PATH: `${cwd()}/appmap.yml`,
        ...env,
      };
      let configuration;
      if (configuration_string === null) {
        configuration = createConfiguration(repository_directory);
        const configuration_data = assertSuccess(
          () => parseYAML(readFileSync(configuration_path, "utf8")),
          "failed to load configuration file %j >> %e",
          configuration_path,
        );
        configuration = extendConfiguration(
          configuration,
          configuration_data,
          dirname(configuration_path),
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
          return promise;
        }
      }
      logInfo("bypassing %o because it is disabled by %o", argv1, enabled);
      return _Promise.resolve(null);
    },
  };
};
