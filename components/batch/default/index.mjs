import { platform } from "node:process";
import { ExternalAppmapError } from "../../error/index.mjs";
import { hasOwnProperty } from "../../util/index.mjs";
import { logError, logDebug, logInfo, logWarning } from "../../log/index.mjs";
import {
  pickPlatformSpecificCommand,
  getConfigurationScenarios,
  resolveConfigurationRepository,
  compileConfigurationCommandAsync,
  resolveConfigurationAutomatedRecorder,
} from "../../configuration-accessor/index.mjs";
import {
  openReceptorAsync,
  closeReceptorAsync,
  adaptReceptorConfiguration,
  minifyReceptorConfiguration,
} from "../../receptor/index.mjs";
import { spawnAsync, killAllAsync } from "./spawn.mjs";
import { whereAsync } from "./where.mjs";

const {
  Set,
  Map,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const isCommandNonNull = ({ command }) => command !== null;

const spawnWithHandlerAsync = async (command, children, tokens, located) => {
  try {
    return await spawnAsync(command, children);
  } catch (error) {
    /* c8 ignore start */ if (
      hasOwnProperty(error, "code") &&
      error.code === "ENOENT" &&
      platform === "win32" &&
      !located
    ) {
      logWarning(
        "Could not find executable %j, we will try to locate it using `where.exe`. Often, this is caused by a missing extension on Windows. For instance `npx jest` should be `npx.cmd jest`. Note that it is possible to provide a windows-specific command with `command-win32`.",
        command.exec,
      );
      return await spawnWithHandlerAsync(
        {
          ...command,
          exec: await whereAsync(command.exec, children),
        },
        children,
        tokens,
        true,
      );
    } /* c8 ignore start */ else {
      logError("Child error %j >> %O", tokens, error);
      throw new ExternalAppmapError("Failed to spawn child process");
    }
  }
};

export const mainAsync = async (process, configuration) => {
  configuration = resolveConfigurationRepository(configuration);
  const { env } = process;
  const children = new Set();
  let interrupted = false;
  process.on("SIGINT", () => {
    killAllAsync(children);
    interrupted = true;
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
    configuration = resolveConfigurationAutomatedRecorder(configuration, env);
    const receptor = await createReceptorAsync(configuration);
    configuration = adaptReceptorConfiguration(receptor, configuration);
    const { tokens } = configuration.command;
    const command = await compileConfigurationCommandAsync(configuration, env);
    logDebug("spawn child command = %j", command);
    const { signal, status } = await spawnWithHandlerAsync(
      command,
      children,
      tokens,
      false,
    );
    if (signal !== null) {
      logInfo("> Killed with: %s", signal);
    } else {
      logInfo("> Exited with: %j", status);
    }
    return { tokens, signal, status };
  };
  const configurations = [
    configuration,
    ...getConfigurationScenarios(configuration),
  ]
    .map(pickPlatformSpecificCommand)
    .filter(isCommandNonNull);
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
      for (const { tokens, signal, status } of summary) {
        /* c8 ignore start */
        logInfo("%j >> %j", tokens, signal === null ? status : signal);
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
