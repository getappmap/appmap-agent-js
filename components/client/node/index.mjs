import { ExternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { resolveConfigurationRepository } from "../../configuration-accessor/index.mjs";
import {
  pickPlatformSpecificCommand,
  compileConfigurationCommandAsync,
  resolveConfigurationAutomatedRecorder,
} from "../../command/index.mjs";
import { spawnAsync, killAllAsync } from "../../spawn/index.mjs";

const { Set } = globalThis;

export const mainAsync = async (process, configuration) => {
  const { env } = process;
  configuration = resolveConfigurationRepository(configuration);
  configuration = pickPlatformSpecificCommand(configuration);
  configuration = resolveConfigurationAutomatedRecorder(configuration, env);
  assert(
    !logErrorWhen(
      configuration.command === null,
      "Missing command to spawn child process",
    ),
    "Missing command to spawn child process",
    ExternalAppmapError,
  );
  const children = new Set();
  process.on("SIGINT", () => {
    killAllAsync(children);
  });
  const { signal, status } = await spawnAsync(
    await compileConfigurationCommandAsync(configuration, env),
    children,
  );
  return signal === null ? status : 1;
};
