import minimist from "minimist";
import { readFile, writeFile } from "fs/promises";
import YAML from "yaml";

const { stringify: stringifyJSON } = JSON;
const { parse: parseYAML, stringify: stringifyYAML } = YAML;

export default (dependencies) => {
  const {
    expect: { expect },
    questionnaire: { questionConfigAsync },
    prompts: { prompts },
    util: { getDirectory, coalesce },
    expect: { expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;
  const loadConfigurationFileAsync = async (path) => {
    let content;
    try {
      content = await readFile(path, "utf8");
    } catch (error) {
      expect(
        error.code === "ENOENT",
        "failed to open configuration file %j >> %e",
        path,
        error,
      );
      if (
        !coalesce(
          prompts({
            type: "toggle",
            name: "answer",
            initial: true,
            message: [
              `We could not find a configuration file at ${stringifyJSON(
                path,
              )}.`,
              "Do you wish to answer several questions to create a suitable configuration?",
              `All paths should be relative to ${stringifyJSON(
                getDirectory(path),
              )}.`,
            ].join("\n  "),
            active: "yes",
            inactive: "no",
          }),
          "answer",
          false,
        )
      ) {
        return { packages: ["*", "**/*"] };
      }
      const config = await questionConfigAsync();
      if (
        coalesce(
          prompts({
            type: "toggle",
            name: "answer",
            initial: true,
            message: `Do you wish to save this configuration for later at ${stringifyJSON(
              path,
            )}?`,
            active: "yes",
            inactive: "no",
          }),
          "answer",
          false,
        )
      ) {
        await writeFile(path, stringifyYAML(config), "utf8");
      }
      return config;
    }
    return expectSuccess(
      () => parseYAML(content),
      "failed to parse configuration file %j >> %e",
      path,
    );
  };
  return {
    loadConfigurationAsync: async ({ env, argv, cwd }) => {
      const path = coalesce(
        env,
        "APPMAP_CONFIGURATION_PATH",
        `${cwd()}/appmap.yml`,
      );
      const { _: child, ...config } = minimist(argv.slice(2));
      let configuration;
      configuration = createConfiguration(
        coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", cwd()),
      );
      configuration = extendConfiguration(
        configuration,
        await loadConfigurationFileAsync(path),
        getDirectory(path),
      );
      configuration = extendConfiguration(configuration, config, cwd());
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
