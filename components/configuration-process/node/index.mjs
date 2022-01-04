import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const _Map = Map;
const { parse: parseYAML } = YAML;
const { parse: parseJSON } = JSON;
const { ownKeys } = Reflect;
const { isArray } = Array;

export default (dependencies) => {
  const {
    util: { hasOwnProperty, coalesce },
    path: { getDirectory, getExtension },
    expect: { expect, expectSuccess },
    configuration: { createConfiguration, extendConfiguration },
  } = dependencies;

  const parsers = new _Map([
    ["json", parseJSON],
    ["yml", parseYAML],
    ["yaml", parseYAML],
  ]);

  const loadConfigFile = (path) => {
    const extension = getExtension(path);
    expect(
      parsers.has(extension),
      "Unsupported configuration file extension: %j.",
      extension,
    );
    const parse = parsers.get(extension);
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
      () => parse(content),
      "Failed to parse configuration file at %j >> %e",
      path,
    );
  };

  const quote = (arg) => `'${arg.replace(/'/gu, "\\'")}'`;

  const aliases = new _Map([
    ["log-level", "log"],
    ["output-dir", "output"],
    ["app-port", "intercept-track-port"],
    ["alt-remote-port", "track-port"],
    ["package", "packages"],
    ["process", "processes"],
  ]);

  const wrapArray = (value) => (isArray(value) ? value : [value]);

  const transformers = new _Map([
    ["packages", wrapArray],
    ["processes", wrapArray],
  ]);

  const addOption = (options, key, value) => {
    if (hasOwnProperty(options, key)) {
      let existing_value = options[key];
      if (!isArray(existing_value)) {
        existing_value = [existing_value];
      }
      if (!isArray(value)) {
        value = [value];
      }
      options[key] = [...existing_value, ...value];
    } else {
      options[key] = value;
    }
  };

  const extractConfig = (argv) => {
    let { _: positional, ...config } = minimist(argv.slice(2));
    if (positional.length > 0) {
      addOption(config, "command", positional.map(quote).join(" "));
    }
    for (const key of ownKeys(config)) {
      if (aliases.has(key)) {
        const value = config[key];
        delete config[key];
        addOption(config, aliases.get(key), value);
      }
    }
    for (const key of ownKeys(config)) {
      if (transformers.has(key)) {
        config[key] = transformers.get(key)(config[key]);
      }
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
