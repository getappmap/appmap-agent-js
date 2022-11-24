const {
  URL,
  Map,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
  Reflect: { ownKeys },
  Array: { isArray },
} = globalThis;

import { readFileSync, writeFileSync } from "node:fs";

import minimist from "minimist";
import YAML from "yaml";

import { ExternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty, coalesce } from "../../util/index.mjs";
import { getCwdUrl } from "../../path/index.mjs";
import {
  toAbsoluteUrl,
  getUrlExtension,
  toDirectoryUrl,
} from "../../url/index.mjs";
import { logError, logErrorWhen } from "../../log/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";

const { parse: parseYAML, stringify: stringifyYAML } = YAML;

const parsers = new Map([
  [".json", parseJSON],
  [".yml", parseYAML],
  [".yaml", parseYAML],
]);

const stringifiers = new Map([
  [".json", stringifyJSON],
  [".yml", stringifyYAML],
  [".yaml", stringifyYAML],
]);

const default_external_configuration = {
  packages: [
    {
      regexp: "^../",
      enabled: false,
    },
    {
      regexp: "(^|/)node_modules/",
      enabled: false,
    },
    {
      regexp: "",
      enabled: true,
    },
  ],
  "default-package": {
    enabled: false,
  },
  exclude: [
    {
      combinator: "and",
      name: "^\\[anonymous\\]$",
      "every-label": "^\\b$",
      excluded: true,
      recursive: false,
    },
  ],
};

const parseConfigurationFile = (parse, content, url) => {
  try {
    return parse(content);
  } catch (error) {
    logError("Failed to parse configuration file at %j >> %O", url, error);
    throw new ExternalAppmapError("Failed to parse configuration file");
  }
};

const loadConfigFile = (url) => {
  const extension = getUrlExtension(url);
  assert(
    !logErrorWhen(
      !parsers.has(extension),
      "Unsupported configuration file extension %j from %j.",
      extension,
      url,
    ),
    "Unsupported configuration file extension",
    ExternalAppmapError,
  );
  const parse = parsers.get(extension);
  let content = null;
  try {
    content = readFileSync(new URL(url), "utf8");
  } catch (error) {
    const { code } = error;
    assert(
      !logErrorWhen(
        code !== "ENOENT",
        "Cannot read configuration file at %j >> %O",
        url,
        error,
      ),
      "Cannot read configuration file",
      ExternalAppmapError,
    );
    const stringify = stringifiers.get(extension);
    writeFileSync(
      new URL(url),
      stringify(default_external_configuration),
      "utf8",
    );
    return default_external_configuration;
  }
  return parseConfigurationFile(parse, content, url);
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
    assert(
      !logErrorWhen(
        hasOwnProperty(config, "command"),
        "The command should not be specified both as positional arguments and in --command",
      ),
      "Conflicting command arguments",
      ExternalAppmapError,
    );
    addOption(config, "command", positional);
  } else {
    assert(
      !logErrorWhen(
        hasOwnProperty(config, "command") && typeof config.command !== "string",
        "There should be only one --command argument",
      ),
      "Too many command arguments",
      ExternalAppmapError,
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

export const loadProcessConfiguration = (process) => {
  const cwd = getCwdUrl(process);
  const url = toAbsoluteUrl(
    coalesce(process.env, "APPMAP_CONFIGURATION_PATH", "appmap.yml"),
    cwd,
  );
  return extendConfiguration(
    extendConfiguration(
      createConfiguration(
        toDirectoryUrl(
          toAbsoluteUrl(
            coalesce(process.env, "APPMAP_REPOSITORY_DIRECTORY", "."),
            cwd,
          ),
        ),
      ),
      loadConfigFile(url),
      url,
    ),
    extractConfig(process.argv),
    cwd,
  );
};
