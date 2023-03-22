import { self_directory, self_package } from "../../self/index.mjs";
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
import { lookupUrl } from "../../matcher/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";

const {
  RegExp,
  Object: { entries: toEntries },
} = globalThis;

export const resolveConfigurationRepository = (configuration) => {
  assert(
    configuration.agent === null,
    "duplicate respository resolution",
    InternalAppmapError,
  );
  const { directory } = configuration.repository;
  const { name, version, homepage } = self_package;
  return extendConfiguration(
    configuration,
    {
      agent: {
        directory: self_directory,
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
}) => main === null || lookupUrl(processes, main, default_process).enabled;

export const getConfigurationPackage = (
  { packages, "default-package": default_package },
  url,
) => lookupUrl(packages, url, default_package);

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
