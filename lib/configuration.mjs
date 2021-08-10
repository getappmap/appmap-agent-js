import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";
import { buildAllAsync } from "../build/index.mjs";

const { parse: parseJSON } = JSON;
const { parse: parseYAML } = YAML;

const {
  util: { getDirectory, coalesce, hasOwnProperty, toAbsolutePath },
  expect: { expect, expectSuccess },
  specifier: { matchSpecifier },
  validate: { validateCookedConfiguration },
  configuration: { createConfiguration, extendConfiguration },
} = await buildAllAsync(
  ["util", "expect", "specifier", "validate", "configuration"],
  "node",
);

export const loadRootConfiguration = (env) => {
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
};

export const createRootConfiguration = (directory, env) => {
  const repository = coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", directory);
  return createConfiguration(repository);
};

export const extendConfigurationFile = (configuration, directory, env) => {
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
};

export const extendConfigurationArgv = (configuration, directory, argv) => {
  const { _: child, ...options } = minimist(argv.slice(2));
  configuration = extendConfiguration(configuration, options, directory);
  if (child.length > 0) {
    configuration = extendConfiguration(
      configuration,
      { children: [child] },
      directory,
    );
  }
  return configuration;
};

export const isConfigurationEnabled = ({ enabled }, directory, argv) => {
  const { length } = argv;
  expect(length > 1, "cannot extract main file from argv: %j", argv);
  const { 1: argv1 } = argv;
  const main = toAbsolutePath(directory, argv1);
  for (const [specifier, boolean] of enabled) {
    if (matchSpecifier(specifier, main)) {
      return boolean;
    }
  }
  return false;
};
