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
import { logError, logInfo } from "../../log/index.mjs";
import {
  getConfigurationScenarios,
  resolveConfigurationRepository,
  extendConfigurationPort,
} from "../../configuration-accessor/index.mjs";
import {
  pickPlatformSpecificCommand,
  compileConfigurationCommandAsync,
  resolveConfigurationAutomatedRecorder,
} from "../../command/index.mjs";
import {
  openReceptorAsync,
  closeReceptorAsync,
  getReceptorTrackPort,
  getReceptorTracePort,
} from "../../receptor/index.mjs";
import {
  createBackend,
  compileBackendTrackArray,
  isBackendEmpty,
} from "../../backend/index.mjs";
import { spawnAsync, killAllAsync } from "../../spawn/index.mjs";

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

const isCommandNonNull = ({ command }) => command !== null;

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

const runConfigurationAsync = async (configuration, env, children) => {
  configuration = resolveConfigurationAutomatedRecorder(configuration, env);
  const command = await compileConfigurationCommandAsync(configuration, env);
  try {
    return await spawnAsync(command, children);
  } catch (error) {
    logError("Child error %j >> %O", configuration.command.tokens, error);
    throw new ExternalAppmapError("Failed to spawn child process");
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
  const ports = {
    "trace-port": getReceptorTracePort(receptor),
    "track-port": getReceptorTrackPort(receptor),
  };
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
  const configurations = [
    configuration,
    ...getConfigurationScenarios(configuration),
  ]
    .map(pickPlatformSpecificCommand)
    .filter(isCommandNonNull)
    .map((configuration) => extendConfigurationPort(configuration, ports));
  const { length } = configurations;
  if (length === 0) {
    logInfo(
      "Appmap server listening to client connections at: %j",
      ports["trace-port"],
    );
    logInfo(
      "Appmap server listening to remote recording requests at: %j",
      ports["track-port"],
    );
    logInfo("Waiting for SIGINT to stop ...");
  } else if (length === 1) {
    const configuration = configurations[0];
    logInfo("Spawning %j ...", configuration.command.tokens);
    logInfo("Send SIGINT to gracefully exit");
    const { signal, status } = await runConfigurationAsync(
      configuration,
      env,
      children,
    );
    /* c8 ignore start */
    if (signal !== null) {
      logInfo("Killed with: %s", signal);
    } else {
      logInfo("Exited with: %j", status);
    }
    /* c8 ignore stop */
    done = true;
  } else {
    logInfo("Spawning %j processes sequentially ...", length);
    logInfo("Send SIGINT to gracefully exit");
    const summary = [];
    for (let index = 0; index < length; index += 1) {
      if (!done) {
        const configuration = configurations[index];
        const {
          command: { tokens },
        } = configuration;
        logInfo("Spawning %j [%j/%j] ...", tokens, index + 1, length);
        const { signal, status } = await runConfigurationAsync(
          configurations[index],
          env,
          children,
        );
        summary.push({ tokens, signal, status });
        /* c8 ignore start */
        if (signal !== null) {
          logInfo("Killed with: %s", signal);
        } else {
          logInfo("Exited with: %j", status);
        }
        /* c8 ignore stop */
      }
    }
    logInfo("Summary:");
    for (const { tokens, signal, status } of summary) {
      logInfo("%j >> %j", tokens, signal === null ? status : signal);
    }
    done = true;
  }
  await flushing;
  await closeReceptorAsync(receptor);
  return 0;
};
