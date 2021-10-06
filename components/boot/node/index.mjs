import minimist from "minimist";
import { readFile, writeFile } from "fs/promises";
import { readFileSync } from "fs";
import YAML from "yaml";

const { stringify: stringifyJSON, parse: parseJSON } = JSON;
const { parse: parseYAML, stringify: stringifyYAML } = YAML;

export default (dependencies) => {
  const {
    expect: { expect },
    validate: { validateConfiguration },
    questionnaire: { questionConfigAsync },
    prompts: { prompts },
    util: { hasOwnProperty, getDirectory, coalesce },
    expect: { expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;

  const loadConfigFile = (path) => {
    const content = expectSuccess(
      () => readFileSync(path, "utf8"),
      "failed to open configuration file %j >> %e",
      path,
    );
    const config = expectSuccess(
      () => parseYAML(content),
      "failed to parse configuration file %j >> %e",
      path,
    );
    return config;
  };

  const loadConfigFileAsync = async (path) => {
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

  const bootBatchAsync = async ({ env, argv, cwd }) => {
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
      await loadConfigFileAsync(path),
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
  };

  const bootAutomatedRecorder = ({ env, argv, cwd }) => {
    expect(
      hasOwnProperty(env, "APPMAP_CONFIGURATION"),
      "missing 'APPMAP_CONFIGURATION' environment variable",
    );
    const { APPMAP_CONFIGURATION: content } = env;
    const configuration = expectSuccess(
      () => parseJSON(content),
      "failed to parse 'APPMAP_CONFIGURATION' environment variable >> %e",
    );
    validateConfiguration(configuration);
    const { length } = argv;
    expect(length > 1, "cannot extract main file from argv: %j", argv);
    const { [1]: main } = argv;
    return extendConfiguration(configuration, { main }, cwd());
  };

  const bootManualRecorder = (home, conf, base) => {
    if (typeof conf === "string") {
      conf = loadConfigFile(conf);
    }
    return extendConfiguration(createConfiguration(home), conf, base);
  };

  const bootManualRecorderAsync = async (home, conf, base) => {
    if (typeof conf === "string") {
      conf = await loadConfigFileAsync(conf);
    }
    return extendConfiguration(createConfiguration(home), conf, base);
  };

  return {
    bootBatchAsync,
    bootProcessRecorder: bootAutomatedRecorder,
    bootMochaRecorder: bootAutomatedRecorder,
    bootRemoteRecorder: bootAutomatedRecorder,
    bootManualRecorderAsync,
    bootManualRecorder,
  };
};
