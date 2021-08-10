
import {
  createRootConfiguration,
  extendConfigurationFile,
  extendConfigurationArgv,
} from "./configuration.mjs";

const { parse: parseYAML } = YAML;

const {cwd, env, argv} = process;
let configuration = createRootConfiguration(cwd, env);
configuration = extendConfigurationFile(configuration, cwd, env);
configuration = extendConfigurationArgv(configuration, cwd, argv);

const {"log-level":log_level, protocol} = configuration;
const {
  util: { getDirectory, toAbsolutePath },
  expect: { expect, expectSuccess, expectSuccessAsync },
  log: { logDebug, logInfo, logWarning },
  child: { spawnChildAsync },
  configuration: {extendConfiguration},
  server: { openServerAsync, closeServer, promiseServerTermination },
} = buildAllAsync(
  ["util", "expect", "log", "child", "configuration", "server"],
  "node",
  {log:log_level, server:protocol},
);

const runChildAsync = async (child) => {
  logInfo("%s ...", description);
  logDebug(
    "spawn child >> exec = %j, argv = %j, options = %j",
    exec,
    argv,
    options,
  );
  const { signal, status } = await expectSuccessAsync(
    spawnChildAsync(child, env, configuration, extendConfiguration);
    "child error %s >> %e",
    description,
  );
  if (signal !== null) {
    logInfo("> Killed with: %s", signal);
  } else {
    logInfo("> Exited with: %j", status);
  }
  return { description, signal, status };
};

const {children, port} = configuration;
const server = await openServerAsync({ host: "localhost", port });
const { length } = children;
try {
  if (length === 0) {
    logWarning("No children found to spawn");
  } else if (length === 1) {
    const [child] = children;
    await runChildAsync(child);
  } else {
    logInfo("Spawning %j children sequentially", length);
    const summary = [];
    for (let index = 0; index < length; index += 1) {
      logInfo("%j/%j", index, length);
      summary.push(await runChildAsync(children[index]));
    }
    logInfo("Summary:");
    for (const { description, signal, status } of summary) {
      logInfo("%s >> %j", description, signal === null ? status : signal);
    }
  }
} finally {
  closeServer(server);
  await promiseServerTermination(server);
}
