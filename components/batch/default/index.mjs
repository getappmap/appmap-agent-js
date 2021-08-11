const _RegExp = RegExp;
const { from: toArray } = Array;
const { entries: toEntries } = Object;

export default (dependencies) => {
  const {
    expect: { expectSuccessAsync, expectSuccess },
    log: { logDebug, logInfo, logWarning },
    child: { spawnChildAsync, getChildDescription },
    configuration: { extendConfiguration },
    server: {
      openServerAsync,
      closeServer,
      promiseServerTermination,
      getServerPort,
    },
  } = dependencies;
  const runChildAsync = async (child, env, configuration) => {
    const description = getChildDescription(child);
    logInfo("%s ...", description);
    logDebug("spawn child %j", child);
    const { signal, status } = await expectSuccessAsync(
      spawnChildAsync(child, env, configuration, extendConfiguration),
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
  return {
    mainAsync: async ({ env }, configuration) => {
      const { scenario, scenarios, port } = configuration;
      const server = await openServerAsync({ host: "localhost", port });
      configuration = {
        ...extendConfiguration(
          configuration,
          { port: getServerPort(server) },
          "/",
        ),
        scenarios: {},
      };
      const regexp = expectSuccess(
        () => new _RegExp(scenario, "u"),
        "scenario configuration property is not a valid regexp: %j >> %e",
        scenario,
      );
      const children = toArray(toEntries(scenarios)).flatMap(
        ([name, children]) => (regexp.test(name) ? children : []),
      );
      const { length } = children;
      try {
        if (length === 0) {
          logWarning(
            "No processes found to spawn in available scenarios for %j",
            scenario,
          );
        } else if (length === 1) {
          const [child] = children;
          await runChildAsync(child, env, configuration);
        } else {
          logInfo("Spawning %j processes sequentially", length);
          const summary = [];
          for (let index = 0; index < length; index += 1) {
            logInfo("%j/%j", index, length);
            summary.push(
              await runChildAsync(children[index], env, configuration),
            );
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
    },
  };
};
