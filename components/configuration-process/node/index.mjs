import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const { parse: parseYAML } = YAML;

export default (dependencies) => {
  const {
    util: { getDirectory, coalesce },
    expect: { expect, expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;

  const loadConfigFile = (path) => {
    let content = null;
    try {
      content = readFileSync(path, "utf8");
    } catch (error) {
      const { code } = error;
      expect(
        code === "ENOENT",
        "Cannot read configuration file at %j >> %e",
        path,
        error,
      );
      return {};
    }
    return expectSuccess(
      () => parseYAML(content),
      "failed to parse configuration file at %j >> %e",
      path,
    );
  };

  return {
    loadProcessConfiguration: ({ env, argv, cwd }) => {
      const path = coalesce(
        env,
        "APPMAP_CONFIGURATION_PATH",
        `${cwd()}/appmap.yml`,
      );
      /* eslint-disable no-unused-vars */
      const { _: positional, ...config } = minimist(argv.slice(2));
      /* eslint-enabled no-unused-vars */
      let configuration;
      configuration = createConfiguration(
        coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", cwd()),
      );
      configuration = extendConfiguration(
        configuration,
        loadConfigFile(path),
        getDirectory(path),
      );
      configuration = extendConfiguration(configuration, config, cwd());
      return configuration;
    },
  };
};
