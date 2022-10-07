const {
  URL,
  Map,
  JSON: { parse: parseJSON },
  Reflect: { ownKeys },
  Array: { isArray },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import minimist from "minimist";
import { readFileSync } from "fs";
import YAML from "yaml";
const { hasOwnProperty, coalesce } = await import(
  `../../util/index.mjs${__search}`
);
const { urlifyPath, getLastURLSegment, appendURLSegment } = await import(
  `../../url/index.mjs${__search}`
);
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);
const { createConfiguration, extendConfiguration } = await import(
  `../../configuration/index.mjs${__search}`
);

const { parse: parseYAML } = YAML;

const parsers = new Map([
  ["json", parseJSON],
  ["yml", parseYAML],
  ["yaml", parseYAML],
]);

const getExtension = (url) => {
  const parts = getLastURLSegment(url).split(".");
  return parts.length === 1 ? "" : parts[parts.length - 1];
};

const loadConfigFile = (url) => {
  const extension = getExtension(url);
  expect(
    parsers.has(extension),
    "Unsupported configuration file extension: %j.",
    extension,
  );
  const parse = parsers.get(extension);
  let content = null;
  try {
    content = readFileSync(new URL(url), "utf8");
  } catch (error) {
    const { code } = error;
    expect(
      code === "ENOENT",
      "Cannot read configuration file at %j >> %O",
      url,
      error,
    );
    return {};
  }
  return expectSuccess(
    () => parse(content),
    "Failed to parse configuration file at %j >> %O",
    url,
  );
};

const aliases = new Map([
  ["appmap-dir", "appmap_dir"],
  ["app-port", "intercept-track-port"],
  ["alt-remote-port", "track-port"],
  ["package", "packages"],
  ["process", "processes"],
]);

const wrapArray = (value) => (isArray(value) ? value : [value]);

const transformers = new Map([
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
  const { _: positional, ...config } = minimist(argv.slice(2));

  if (positional.length > 0) {
    expect(
      !hasOwnProperty(config, "command"),
      "The command should not be specified both as positional arguments and in --command",
    );
    addOption(config, "command", positional);
  } else {
    expect(
      !hasOwnProperty(config, "command") || typeof config.command === "string",
      "There should only be one --command argument",
    );
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
  config.log = {};
  if (hasOwnProperty(config, "log-level")) {
    config.log.level = config["log-level"];
    delete config["log-level"];
  }
  if (hasOwnProperty(config, "log-file")) {
    config.log.file = config["log-file"];
    delete config["log-file"];
  }
  return config;
};

export const loadProcessConfiguration = ({ env, argv, cwd }) => {
  const url = urlifyPath(
    coalesce(env, "APPMAP_CONFIGURATION_PATH", "appmap.yml"),
    urlifyPath(cwd(), "file:///"),
  );
  return extendConfiguration(
    extendConfiguration(
      createConfiguration(
        urlifyPath(
          coalesce(env, "APPMAP_REPOSITORY_DIRECTORY", "."),
          urlifyPath(cwd(), "file:///"),
        ),
      ),
      loadConfigFile(url),
      appendURLSegment(url, ".."),
    ),
    extractConfig(argv),
    urlifyPath(cwd(), "file:///"),
  );
};
