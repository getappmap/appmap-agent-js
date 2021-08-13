import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const { parse: parseYAML } = YAML;

export default (dependencies) => {
  const {
    util: { getDirectory, coalesce },
    expect: { expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  return {
    loadConfiguration: ({ env, argv, cwd }) => {
      const path = coalesce(
        env,
        "APPMAP_CONFIGURATION_PATH",
        `${cwd()}/appmap.yml`,
      );
      const { _: child, ...options } = minimist(argv.slice(2));
      let configuration;
      configuration = createConfiguration(
        coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", cwd()),
      );
      configuration = extendConfiguration(
        configuration,
        { mode: "remote" },
        cwd(),
      );
      configuration = extendConfiguration(
        configuration,
        expectSuccess(
          () => parseYAML(readFileSync(path, "utf8")),
          "failed to load configuration file %j >> %e",
          path,
        ),
        getDirectory(path),
      );
      configuration = extendConfiguration(configuration, options, cwd());
      if (child.length > 0) {
        configuration = extendConfiguration(
          configuration,
          { scenarios: { anonymous: child } },
          cwd(),
        );
      }
      return configuration;
    },
  };
};
