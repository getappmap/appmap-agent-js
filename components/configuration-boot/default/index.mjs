import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const { parse: parseJSON } = JSON;
const { parse: parseYAML } = YAML;

export default (dependencies) => {
  const {
    util: { getDirectory, coalesce, hasOwnProperty },
    expect: { expect, expectSuccess },
    validate: { validateCookedConfiguration },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  return {
    loadRootConfiguration: (env) => {
      expect(
        hasOwnProperty(env, "APPMAP_CONFIGURATION"),
        "missing 'APPMAP_CONFIGURATION' environment variable",
      );
      const { APPMAP_CONFIGURATION: content } = env;
      const configuration = expectSuccess(
        () => parseJSON(content),
        "failed to parse 'APPMAP_CONFIGURATION' environment variable >> %e",
      );
      validateCookedConfiguration(configuration);
      return configuration;
    },
    createRootConfiguration: (directory, env) =>
      createConfiguration(
        coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", directory),
      ),
    extendConfigurationFile: (configuration, directory, env) => {
      const path = coalesce(
        env,
        "APPMAP_CONFIGURATION_PATH",
        `${directory}/appmap.yml`,
      );
      return extendConfiguration(
        configuration,
        expectSuccess(
          () => parseYAML(readFileSync(path, "utf8")),
          "failed to load configuration file %j >> %e",
          path,
        ),
        getDirectory(path),
      );
    },
    extendConfigurationArgv: (configuration, directory, argv) => {
      const { _: child, ...options } = minimist(argv.slice(2));
      configuration = extendConfiguration(configuration, options, directory);
      if (child.length > 0) {
        configuration = extendConfiguration(
          configuration,
          { scenarios: { anonymous: child } },
          directory,
        );
      }
      return configuration;
    },
  };
};
