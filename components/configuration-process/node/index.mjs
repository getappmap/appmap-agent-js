import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";

const _Map = Map;
const { parse: parseYAML } = YAML;
const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    util: { getDirectory, coalesce, getExtension },
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
