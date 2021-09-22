const _RegExp = RegExp;
const { from: toArray } = Array;
const { entries: toEntries } = Object;

export default (dependencies) => {
  const {
    util: { assert },
    backend: { createBackend },
    expect: { expectSuccessAsync, expectSuccess },
    log: { logDebug, logInfo, logWarning },
    spawn: { spawn },
    child: { compileChild, getChildDescription },
    configuration: { extendConfiguration },
    server: {
      openServerAsync,
      closeServer,
      promiseServerTermination,
      getServerPort,
    },
  } = dependencies;
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
      const { scenario, scenarios, port } = configuration;
      const backend = createBackend();
      const server = await openServerAsync(backend, {
        host: "localhost",
        port,
      });
      configuration = {
        ...extendConfiguration(
          configuration,
          { port: getServerPort(server) },
          "/",
        ),
        scenarios: {},
      };
      const runChildAsync = async (child) => {
        const description = getChildDescription(child);
        logInfo("%s ...", description);
        const { exec, argv, options } = compileChild(
          child,
          env,
          configuration,
          extendConfiguration,
        );
        logDebug(
          "spawn child: exec = %j, argv = %j, options = %j",
          exec,
          argv,
          options,
        );
        subprocess = spawn(exec, argv, options);
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
            if (!interrupted) {
              logInfo("%j/%j", index + 1, length);
              summary.push(
                await runChildAsync(children[index], env, configuration),
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
        closeServer(server);
        await promiseServerTermination(server);
      }
    },
  };
};
