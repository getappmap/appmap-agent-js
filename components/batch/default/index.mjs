const _RegExp = RegExp;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expectSuccessAsync, expectSuccess },
    log: { logDebug, logInfo, logWarning },
    spawn: { spawn },
    configuration: { extendConfiguration, compileCommandConfiguration },
    receptor: {
      openReceptorAsync,
      closeReceptorAsync,
      getReceptorTracePort,
      getReceptorTrackPort,
    },
  } = dependencies;
  const isCommandNonNull = ({ command }) => command !== null;
  return {
    mainAsync: async (process, configuration) => {
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
      const receptor = await openReceptorAsync(configuration);
      configuration = extendConfiguration(
        configuration,
        {
          "trace-port": getReceptorTracePort(receptor),
          "track-port": getReceptorTrackPort(receptor),
        },
        null,
      );
      const runConfigurationAsync = async (configuration, env) => {
        const { command: description } = configuration;
        logInfo("%s ...", description);
        const { command, options } = compileCommandConfiguration(
          configuration,
          env,
        );
        logDebug("spawn child command = %j, options = %j", command, options);
        subprocess = spawn("/bin/sh", ["-c", command], options);
        const { signal, status } = await expectSuccessAsync(
          new Promise((resolve, reject) => {
            subprocess.on("error", reject);
            subprocess.on("close", (status, signal) => {
              resolve({ signal, status });
            });
          }),
          "child error %s >> %e",
          description,
        );
        subprocess = null;
        if (signal !== null) {
          logInfo("> Killed with: %s", signal);
        } else {
          logInfo("> Exited with: %j", status);
        }
        return { description, signal, status };
      };
      const { scenario, scenarios } = configuration;
      const regexp = expectSuccess(
        () => new _RegExp(scenario, "u"),
        "Scenario configuration field is not a valid regexp: %j >> %e",
        scenario,
      );
      const configurations = [
        configuration,
        ...scenarios.filter(({ name }) => regexp.test(name)),
      ].filter(isCommandNonNull);
      const { length } = configurations;
      try {
        if (length === 0) {
          logWarning(
            "No processes found to spawn in available scenarios for %j",
            scenario,
          );
        } else if (length === 1) {
          const [configuration] = configurations;
          await runConfigurationAsync(configuration, env);
        } else {
          logInfo("Spawning %j processes sequentially", length);
          const summary = [];
          for (let index = 0; index < length; index += 1) {
            if (!interrupted) {
              logInfo("%j/%j", index + 1, length);
              summary.push(
                await runConfigurationAsync(configurations[index], env),
              );
            }
          }
          logInfo("Summary:");
          for (const { description, signal, status } of summary) {
            /* c8 ignore start */
            logInfo("%s >> %j", description, signal === null ? status : signal);
            /* c8 ignore stop */
          }
        }
      } finally {
        await closeReceptorAsync(receptor);
      }
    },
  };
};
