
import Assert from "../components/assert/error.mjs";
import Log from "../component/log/node-warning.mjs";
import Util from "../component/util/default.mjs";
import Specifier from "../component/specific/default.mjs";
import Repository from "../component/repository/node.mjs";
import Conifguration from "../component/repository/configuration.mjs";

const assert = Assert({});
const log = Log({assert});
const util = Util({assert, log});
const specifier = Specifier

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
