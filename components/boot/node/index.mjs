import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const { parse: parseJSON } = JSON;
const { parse: parseYAML } = YAML;

export default (dependencies) => {
  const {
    expect: { expect },
    validate: { validateConfiguration },
    util: { hasOwnProperty, getDirectory, coalesce },
    expect: { expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;

  const loadConfigFile = (path) => {
    const content = expectSuccess(
      () => readFileSync(path, "utf8"),
      "failed to read configuration file %j, running `npx appmap-agent-js setup` will help you create one >> %e",
      path,
    );
    const config = expectSuccess(
      () => parseYAML(content),
      "failed to parse configuration file %j, running `npx appmap-agent-js setup` will help you create one >> %e",
      path,
    );
    return config;
  };

  const bootBatch = ({ env, argv, cwd }) => {
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
      loadConfigFile(path),
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

  return {
    bootBatch,
    bootProcessRecorder: bootAutomatedRecorder,
    bootMochaRecorder: bootAutomatedRecorder,
    bootRemoteRecorder: bootAutomatedRecorder,
    bootManualRecorder,
  };
};
