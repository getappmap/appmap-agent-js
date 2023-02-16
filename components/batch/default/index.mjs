import { platform } from "node:process";
import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { ExternalAppmapError } from "../../error/index.mjs";
import {
  toAbsoluteUrl,
  getUrlBasename,
  getUrlExtension,
} from "../../url/index.mjs";
import { hasOwnProperty } from "../../util/index.mjs";
import { logError, logDebug, logInfo, logWarning } from "../../log/index.mjs";
import {
  getConfigurationScenarios,
  resolveConfigurationRepository,
} from "../../configuration-accessor/index.mjs";
import {
  pickPlatformSpecificCommand,
  compileConfigurationCommandAsync,
  resolveConfigurationAutomatedRecorder,
} from "../../command/index.mjs";
import {
  openReceptorAsync,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} from "../../receptor/index.mjs";
import {
  createBackend,
  compileBackendTrackArray,
  isBackendEmpty,
} from "../../backend/index.mjs";
import { spawnAsync, killAllAsync } from "./spawn.mjs";
import { whereAsync } from "./where.mjs";

const {
  Promise,
  String,
  URL,
  Set,
  setTimeout,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const FLUSH_TIMEOUT = 1000;
const ABRUPT_TIMEOUT = 1000;

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

const refreshUrl = (urls, url) => {
  const basename = getUrlBasename(url);
  const extension = getUrlExtension(url);
  let index = 0;
  while (urls.has(url)) {
    index += 1;
    url = toAbsoluteUrl(`${basename}-${String(index)}${extension}`, url);
  }
  urls.add(url);
  return url;
};

export const flushBackendAsync = async (urls, backend, abrupt) => {
  for (const { url, content } of compileBackendTrackArray(backend, abrupt)) {
    const fresh_url = refreshUrl(urls, url);
    await mkdirAsync(new URL(".", fresh_url), { recursive: true });
    await writeFileAsync(
      new URL(fresh_url),
      stringifyJSON(content, null, 2),
      "utf8",
    );
    logInfo("Appmap written at %j", fresh_url);
  }
};

export const mainAsync = async (process, configuration) => {
  configuration = resolveConfigurationRepository(configuration);
  const { env } = process;
  const children = new Set();
  let done = false;
  process.on("SIGINT", () => {
    killAllAsync(children);
    done = true;
  });
  const urls = new Set();
  const backend = createBackend(configuration);
  const receptor = await openReceptorAsync(configuration, backend);
  const flushing = (async () => {
    while (!done) {
      await flushBackendAsync(urls, backend, false);
      if (!done) {
        await new Promise((resolve) => {
          setTimeout(resolve, FLUSH_TIMEOUT);
        });
      }
    }
    if (!isBackendEmpty(backend)) {
      await new Promise((resolve) => {
        setTimeout(resolve, ABRUPT_TIMEOUT);
      });
      await flushBackendAsync(urls, backend, true);
    }
  })();
  const runConfigurationAsync = async (configuration, env, children) => {
    configuration = pickPlatformSpecificCommand(configuration);
    if (configuration.command === null) {
      logWarning("Missing command to spawn process");
      return { tokens: [], signal: null, status: 0 };
    } else {
      configuration = resolveConfigurationAutomatedRecorder(configuration, env);
      const { tokens } = configuration.command;
      const command = await compileConfigurationCommandAsync(
        configuration,
        env,
      );
      logDebug("spawn child command = %j", command);
      const { signal, status } = await spawnWithHandlerAsync(
        command,
        children,
        tokens,
        false,
      );
      return { tokens, signal, status };
    }
  };
  const configurations = [
    configuration,
    ...getConfigurationScenarios(configuration),
  ].map((configuration) => adaptReceptorConfiguration(receptor, configuration));
  const { length } = configurations;
  try {
    if (length === 1) {
      await runConfigurationAsync(configurations[0], env, children);
    } else {
      logInfo("Spawning %j processes sequentially", length);
      const summary = [];
      for (let index = 0; index < length; index += 1) {
        if (!done) {
          logInfo("%j/%j", index + 1, length);
          const { tokens, signal, status } = await runConfigurationAsync(
            configurations[index],
            env,
            children,
          );
          summary.push({ tokens, signal, status });
          if (signal !== null) {
            logInfo("%j >> Killed with: %s", tokens, signal);
          } else {
            logInfo("%j >> Exited with: %j", tokens, status);
          }
        }
      }
      logInfo("Summary:");
      for (const { tokens, signal, status } of summary) {
        logInfo("%j >> %j", tokens, signal === null ? status : signal);
      }
    }
  } finally {
    await closeReceptorAsync(receptor);
    done = true;
    await flushing;
  }
  return 0;
};
