import { platform } from "node:process";
import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import {
  toAbsoluteUrl,
  getUrlBasename,
  getUrlExtension,
} from "../../url/index.mjs";
import { hasOwnProperty, assert } from "../../util/index.mjs";
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
} from "../../receptor/index.mjs";
import {
  createBackend,
  sendBackend,
  compileBackendTrackArray,
  isBackendSessionEmpty,
} from "../../backend/index.mjs";
import { spawnAsync, killAllAsync } from "./spawn.mjs";
import { whereAsync } from "./where.mjs";

const {
  Promise,
  String,
  URL,
  Set,
  setTimeout,
  clearTimeout,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const ABRUPT_TIMEOUT = 1000;
const FLUSH_TIMEOUT = 1000;

// Support for remote recording: (GET|POST|DELETE) /_appmap/record
const DEFAULT_SESSION = "_appmap";

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

const sendBatchBackend = (backend, session, message) => {
  assert(
    sendBackend(backend, session, message),
    "invalid batch message",
    InternalAppmapError,
  );
};

const defineConfigurationSession = (configuration) => {
  if (configuration.session === null) {
    return {
      ...configuration,
      session: DEFAULT_SESSION,
    };
  } else {
    return configuration;
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

export const flushBackendSessionAsync = async (
  urls,
  backend,
  session,
  abrupt,
) => {
  for (const { url, content } of compileBackendTrackArray(
    backend,
    session,
    abrupt,
  )) {
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
  let interrupted = false;
  process.on("SIGINT", () => {
    killAllAsync(children);
    interrupted = true;
  });
  const urls = new Set();
  const backend = createBackend(configuration);
  const receptor = await openReceptorAsync(configuration, backend);
  const runConfigurationAsync = async (configuration, env) => {
    configuration = defineConfigurationSession(configuration);
    configuration = resolveConfigurationAutomatedRecorder(configuration, env);
    configuration = adaptReceptorConfiguration(receptor, configuration);
    const { session } = configuration;
    sendBatchBackend(backend, session, { type: "open" });
    const { tokens } = configuration.command;
    const command = await compileConfigurationCommandAsync(configuration, env);
    logDebug("spawn child command = %j", command);
    let signal = null;
    let status = 0;
    let done = false;
    let timer = null;
    const flush = async () => {
      timer = null;
      if (!done) {
        await flushBackendSessionAsync(urls, backend, session, false);
        timer = setTimeout(flush, FLUSH_TIMEOUT);
      }
    };
    timer = setTimeout(flush, FLUSH_TIMEOUT);
    try {
      ({ signal, status } = await spawnWithHandlerAsync(
        command,
        children,
        tokens,
        false,
      ));
    } finally {
      done = true;
      if (timer !== null) {
        clearTimeout(timer);
      }
    }
    if (signal !== null) {
      logInfo("> Killed with: %s", signal);
    } else {
      logInfo("> Exited with: %j", status);
    }
    await flushBackendSessionAsync(urls, backend, session, false);
    if (!isBackendSessionEmpty(backend, session)) {
      await new Promise((resolve) => {
        setTimeout(resolve, ABRUPT_TIMEOUT);
      });
      await flushBackendSessionAsync(urls, backend, session, true);
    }
    sendBatchBackend(backend, session, { type: "close" });
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
    await closeReceptorAsync(receptor);
  }
  return 0;
};
