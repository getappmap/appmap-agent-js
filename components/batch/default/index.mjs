const _RegExp = RegExp;
const _Map = Map;
const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    util: { assert },
    expect: { expectSuccessAsync, expectSuccess },
    log: { logDebug, logInfo, logWarning },
    spawn: { spawn },
    "configuration-helper": { compileCommandConfiguration },
    receptor: {
      openReceptorAsync,
      closeReceptorAsync,
      adaptReceptorConfiguration,
      minifyReceptorConfiguration,
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
      const receptors = new _Map();
      const createReceptorAsync = async (configuration) => {
        const receptor_configuration =
          minifyReceptorConfiguration(configuration);
        const key = stringifyJSON(receptor_configuration);
        if (!receptors.has(key)) {
          receptors.set(key, await openReceptorAsync(receptor_configuration));
        }
        return receptors.get(key);
      };
      const runConfigurationAsync = async (configuration, env) => {
        const receptor = await createReceptorAsync(configuration);
        configuration = adaptReceptorConfiguration(receptor, configuration);
        const {
          command: { value: description },
        } = configuration;
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
        for (const receptor of receptors.values()) {
          await closeReceptorAsync(receptor);
        }
      }
    },
  };
};
