const {
  Map,
  JSON: { stringify: stringifyJSON },
  setTimeout,
  clearTimeout,
  Promise,
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { logError, logDebug, logInfo, logWarning } from "../../log/index.mjs";
import { spawn } from "../../spawn/index.mjs";
import {
  getConfigurationScenarios,
  resolveConfigurationRepository,
  compileConfigurationCommand,
  resolveConfigurationAutomatedRecorder,
} from "../../configuration-accessor/index.mjs";
import {
  openReceptorAsync,
  closeReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
} from "../../receptor/index.mjs";

const getCommandDescription = ({ exec, argv }) => ({ exec, argv });
const isCommandNonNull = ({ command }) => command !== null;

export const mainAsync = async (process, configuration) => {
  configuration = resolveConfigurationRepository(configuration);
  const { env } = process;
  let interrupted = false;
  let subprocess = null;
  process.on("SIGINT", () => {
    interrupted = true;
    if (subprocess !== null) {
      const timeout = setTimeout(() => {
        /* c8 ignore start */
        assert(
          subprocess !== null,
          "the timer should have been cleared if the process closed itself",
          InternalAppmapError,
        );
        subprocess.kill("SIGKILL");
        /* c8 ignore stop */
      }, 1000);
      subprocess.on("close", () => {
        clearTimeout(timeout);
      });
      subprocess.kill("SIGINT");
    }
  });
  const receptors = new Map();
  const createReceptorAsync = async (configuration) => {
    const receptor_configuration = minifyReceptorConfiguration(configuration);
    const key = stringifyJSON(receptor_configuration);
    if (!receptors.has(key)) {
      receptors.set(key, await openReceptorAsync(receptor_configuration));
    }
    return receptors.get(key);
  };
  const runConfigurationAsync = async (configuration, env) => {
    configuration = resolveConfigurationAutomatedRecorder(configuration);
    const receptor = await createReceptorAsync(configuration);
    configuration = adaptReceptorConfiguration(receptor, configuration);
    const description = getCommandDescription(configuration.command);
    const command = compileConfigurationCommand(configuration, env);
    logDebug("spawn child command = %j", command);
    subprocess = spawn(command.exec, command.argv, command.options);
    const { signal, status } = await new Promise((resolve, reject) => {
      subprocess.on("error", (error) => {
        logError("Child error %j >> %O", description, error);
        reject(new ExternalAppmapError("Failed to spawn batch child process"));
      });
      subprocess.on("close", (status, signal) => {
        resolve({ signal, status });
      });
    });
    subprocess = null;
    if (signal !== null) {
      logInfo("> Killed with: %s", signal);
    } else {
      logInfo("> Exited with: %j", status);
    }
    return { description, signal, status };
  };
  const configurations = [
    configuration,
    ...getConfigurationScenarios(configuration),
  ].filter(isCommandNonNull);
  const { length } = configurations;
  try {
    if (length === 0) {
      logWarning("Could not find any command to spawn.");
    } else if (length === 1) {
      const [configuration] = configurations;
      await runConfigurationAsync(configuration, env);
    } else {
      logInfo("Spawning %j processes sequentially", length);
      const summary = [];
      for (let index = 0; index < length; index += 1) {
        if (!interrupted) {
          logInfo("%j/%j", index + 1, length);
          summary.push(await runConfigurationAsync(configurations[index], env));
        }
      }
      logInfo("Summary:");
      for (const { description, signal, status } of summary) {
        /* c8 ignore start */
        logInfo("%j >> %j", description, signal === null ? status : signal);
        /* c8 ignore stop */
      }
    }
  } finally {
    for (const receptor of receptors.values()) {
      await closeReceptorAsync(receptor);
    }
  }
  return 0;
};
