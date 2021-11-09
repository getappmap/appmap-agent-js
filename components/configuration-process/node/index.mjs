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

  const quote = (arg) => `'${arg.replace(/'/gu, "\\'")}'`;

  const extractConfig = (argv) => {
    let { _: positional, ...config } = minimist(argv.slice(2));
    if (positional.length > 0) {
      config = {
        ...config,
        command: positional.map(quote).join(" "),
      };
    }
    return config;
  };

  return {
    loadProcessConfiguration: ({ env, argv, cwd }) => {
      const path = coalesce(
        env,
        "APPMAP_CONFIGURATION_PATH",
        `${cwd()}/appmap.yml`,
      );
      return extendConfiguration(
        extendConfiguration(
          createConfiguration(
            coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", cwd()),
          ),
          loadConfigFile(path),
          getDirectory(path),
        ),
        extractConfig(argv),
        cwd(),
      );
    },
  };
};
