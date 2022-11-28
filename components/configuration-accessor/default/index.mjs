import { readFileSync } from "node:fs";
import { home } from "../../home/index.mjs";
import {
  toDirectoryPath,
  convertPathToFileUrl,
  toAbsolutePath,
} from "../../path/index.mjs";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { logWarningWhen, logError } from "../../log/index.mjs";
import {
  extractRepositoryHistory,
  extractRepositoryPackage,
} from "../../repository/index.mjs";
import { matchSpecifier } from "../../specifier/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { resolveShell } from "./escape.mjs";
import * as MochaRecorder from "./mocha.mjs";
import * as ProcessRecorder from "./process.mjs";
import * as ProcessRecorderRecursive from "./process-recursive.mjs";
import * as RemoteRecorder from "./remote.mjs";
import * as RemoteRecorderRecursive from "./remote-recursive.mjs";

const { doesSupportTokens: isMochaTokens, doesSupportSource: isMochaSource } =
  MochaRecorder;

const {
  String,
  URL,
  RegExp,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

const getSpecifierValue = (pairs, key, def) => {
  for (const [specifier, value] of pairs) {
    if (matchSpecifier(specifier, key)) {
      return value;
    }
  }
  return def;
};

export const resolveConfigurationRepository = (configuration) => {
  assert(
    configuration.agent === null,
    "duplicate respository resolution",
    InternalAppmapError,
  );
  const { directory } = configuration.repository;
  const { name, version, homepage } = parseJSON(
    readFileSync(new URL("package.json", home), "utf8"),
  );
  return extendConfiguration(
    configuration,
    {
      agent: {
        directory: home,
        package: { name, version, homepage },
      },
      repository: {
        directory,
        history: extractRepositoryHistory(directory),
        package: extractRepositoryPackage(directory),
      },
    },
    directory,
  );
};

export const resolveConfigurationAutomatedRecorder = (configuration) => {
  if (configuration.recorder === null) {
    assert(
      configuration.command !== null,
      "cannot resolve recorder because command is missing",
      InternalAppmapError,
    );
    configuration = extendConfiguration(
      configuration,
      {
        recorder: (
          configuration.command.tokens === null
            ? isMochaSource(configuration.command.source)
            : isMochaTokens(configuration.command.tokens)
        )
          ? "mocha"
          : "process",
      },
      configuration.repository.directory,
    );
  }
  return configuration;
};

export const resolveConfigurationManualRecorder = (configuration) => {
  const {
    recorder,
    hooks: { esm },
  } = configuration;
  logWarningWhen(
    recorder !== "manual",
    "Manual recorder expected configuration field 'recorder' to be %s and got %j.",
    "manual",
    recorder,
  );
  logWarningWhen(
    esm,
    "Manual recorder does not support native module recording and configuration field 'hooks.esm' is enabled.",
  );
  return extendConfiguration(
    configuration,
    {
      recorder: "manual",
      hooks: {
        esm: false,
      },
    },
    configuration.repository.directory,
  );
};

export const extendConfigurationNode = (
  configuration,
  { version, argv, cwd },
) => {
  assert(argv.length >= 2, "expected at least two argv", InternalAppmapError);
  const [, main] = argv;
  assert(
    version.startsWith("v"),
    "expected version to start with v",
    InternalAppmapError,
  );
  return {
    ...configuration,
    engine: `node@${version.substring(1)}`,
    main: convertPathToFileUrl(toAbsolutePath(main, toDirectoryPath(cwd()))),
  };
};

export const extendConfigurationPort = (configuration, ports) => {
  for (const [key, new_port] of toEntries(ports)) {
    const { [key]: old_port } = configuration;
    if (old_port === 0 || old_port === "") {
      assert(
        typeof new_port === typeof old_port,
        "port type mismatch",
        InternalAppmapError,
      );
      configuration = extendConfiguration(
        configuration,
        { [key]: new_port },
        configuration.repository.directory,
      );
    } else {
      assert(old_port === new_port, "port mismatch", InternalAppmapError);
    }
  }
  return configuration;
};

export const isConfigurationEnabled = ({
  processes,
  main,
  "default-process": default_process,
}) => main === null || getSpecifierValue(processes, main, default_process);

export const getConfigurationPackage = (
  { packages, "default-package": default_package },
  url,
) => getSpecifierValue(packages, url, default_package);

const compileScenario = (scenario) => {
  try {
    return new RegExp(scenario, "u");
  } catch (error) {
    logError(
      "Scenario configuration field is not a valid regexp: %j >> %O",
      scenario,
      error,
    );
    throw new ExternalAppmapError("Scenario is not a regexp");
  }
};

export const getConfigurationScenarios = (configuration) => {
  const { scenarios, scenario } = configuration;
  const regexp = compileScenario(scenario);
  return scenarios
    .filter(({ key }) => regexp.test(key))
    .map(({ base, value }) =>
      extendConfiguration(configuration, { scenarios: {}, ...value }, base),
    );
};

const recorders = {
  process: {
    true: ProcessRecorderRecursive,
    false: ProcessRecorder,
  },
  remote: {
    true: RemoteRecorderRecursive,
    false: RemoteRecorder,
  },
  mocha: {
    true: MochaRecorder,
    false: MochaRecorder,
  },
};

export const compileConfigurationCommand = (configuration, env) => {
  assert(
    configuration.agent !== null,
    "missing agent in configuration",
    InternalAppmapError,
  );
  assert(
    configuration.command !== null,
    "missing command in configuration",
    InternalAppmapError,
  );
  const {
    agent: { directory },
    recorder,
    "recursive-process-recording": recursive,
    command: { source, tokens },
    "command-options": options,
  } = configuration;
  env = {
    ...env,
    ...options.env,
    APPMAP_CONFIGURATION: stringifyJSON(configuration),
  };
  const { hookCommandSource, hookCommandTokens, hookEnvironment } =
    recorders[recorder][String(recursive)];
  const [exec, ...argv] =
    tokens === null
      ? hookCommandSource(source, resolveShell(options.shell, env), directory)
      : hookCommandTokens(tokens, directory);
  return {
    exec,
    argv,
    options: {
      ...options,
      env: hookEnvironment(env, directory),
    },
  };
};
