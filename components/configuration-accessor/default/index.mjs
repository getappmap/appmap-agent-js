const _URL = URL;
const _RegExp = RegExp;
const { entries: toEntries } = Object;
const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    util: { assert, coalesce },
    url: { pathifyURL, urlifyPath, appendURLSegmentArray },
    expect: { expect, expectSuccess },
    log: { logDebug, logInfo, logGuardWarning },
    repository: {
      extractRepositoryDependency,
      extractRepositoryHistory,
      extractRepositoryPackage,
    },
    specifier: { matchSpecifier },
    configuration: { extendConfiguration },
  } = dependencies;

  const getSpecifierValue = (pairs, key) => {
    for (const [specifier, value] of pairs) {
      if (matchSpecifier(specifier, key)) {
        return value;
      }
    }
    /* c8 ignore start */
    assert(false, "missing matching specifier");
    /* c8 ignore stop */
  };

  const isMocha = ({ exec }) => exec.split(".")[0] === "mocha";
  const isNpxMocha = ({ exec, argv }) =>
    exec.split(".")[0] === "npx" && argv.length > 0 && argv[0] === "mocha";
  const isNodeMocha = ({ exec, argv }) =>
    exec === "node" &&
    argv.length > 0 &&
    /[\\/]mocha(.[a-z]+)?$/u.test(argv[0]);
  const isNpmMocha = ({ exec, argv }) =>
    exec.split(".")[0] === "npm" &&
    argv.length > 1 &&
    argv[0] === "exec" &&
    argv[1] === "mocha";

  return {
    resolveConfigurationRepository: (configuration) => {
      assert(configuration.agent === null, "duplicate respository resolution");
      const { directory } = configuration.repository;
      return extendConfiguration(
        configuration,
        {
          agent: extractRepositoryDependency(directory, [
            "@appland",
            "appmap-agent-js",
          ]),
          repository: {
            directory,
            history: extractRepositoryHistory(directory),
            package: extractRepositoryPackage(directory),
          },
        },
        directory,
      );
    },
    resolveConfigurationAutomatedRecorder: (configuration) => {
      if (configuration.recorder === null) {
        assert(
          configuration.command !== null,
          "cannot resolve recorder because command is missing",
        );
        configuration = extendConfiguration(
          configuration,
          {
            recorder:
              isMocha(configuration.command) ||
              isNpxMocha(configuration.command) ||
              isNpmMocha(configuration.command) ||
              isNodeMocha(configuration.command)
                ? "mocha"
                : "remote",
          },
          configuration.repository.directory,
        );
      }
      if (configuration.output.directory === null) {
        configuration = extendConfiguration(
          configuration,
          {
            output: {
              directory:
                configuration.recorder === "mocha"
                  ? "tmp/appmap/mocha"
                  : "tmp/appmap",
            },
          },
          configuration.repository.directory,
        );
      }
      return configuration;
    },
    resolveConfigurationManualRecorder: (configuration) => {
      const {
        recorder,
        hooks: { esm },
      } = configuration;
      logGuardWarning(
        recorder !== "manual",
        "Manual recorder expected configuration field 'recorder' to be %s and got %j.",
        "manual",
        recorder,
      );
      logGuardWarning(
        esm,
        "Manual recorder does not support native module recording and configuration field 'hooks.esm' is enabled.",
      );
      return extendConfiguration(
        configuration,
        {
          recorder: "manual",
          hooks: {
            esm: false,
          },
        },
        configuration.repository.directory,
      );
    },
    extendConfigurationNode: (configuration, { version, argv, cwd }) => {
      assert(argv.length >= 2, "expected at least two argv");
      const [, main] = argv;
      assert(version.startsWith("v"), "expected version to start with v");
      return extendConfiguration(
        configuration,
        {
          engine: {
            name: "node",
            version: version.substring(1),
          },
          main,
        },
        urlifyPath(cwd(), configuration.repository.directory),
      );
    },
    extendConfigurationPort: (configuration, ports) => {
      for (const [key, new_port] of toEntries(ports)) {
        const { [key]: old_port } = configuration;
        if (old_port === 0 || old_port === "") {
          assert(typeof new_port === typeof old_port, "port type mismatch");
          configuration = extendConfiguration(
            configuration,
            { [key]: new_port },
            configuration.repository.directory,
          );
        } else {
          assert(old_port === new_port);
        }
      }
      return configuration;
    },
    isConfigurationEnabled: ({ processes, main }) => {
      const enabled = main === null || getSpecifierValue(processes, main);
      logInfo(`%s %s.`, enabled ? "Recording" : "Bypassing", main);
      return enabled;
    },
    getConfigurationPackage: ({ packages }, url) => {
      const options = getSpecifierValue(packages, url);
      logDebug(
        "%s source file %j",
        options.enabled ? "Instrumenting" : "Not instrumenting",
        url,
      );
      return options;
    },
    getConfigurationScenarios: (configuration) => {
      const { scenarios, scenario } = configuration;
      const regexp = expectSuccess(
        () => new _RegExp(scenario, "u"),
        "Scenario configuration field is not a valid regexp: %j >> %e",
        scenario,
      );
      return scenarios
        .filter(({ key }) => regexp.test(key))
        .map(({ base, value }) =>
          extendConfiguration(configuration, { scenarios: {}, ...value }, base),
        );
    },
    compileConfigurationCommand: (configuration, env) => {
      assert(configuration.agent !== null, "missing agent in configuration");
      assert(
        configuration.command !== null,
        "missing command in configuration",
      );
      const {
        command,
        recorder,
        "command-options": options,
        "recursive-process-recording": recursive,
        agent: { directory },
      } = configuration;
      let { base, exec, argv } = command;
      env = {
        ...env,
        ...options.env,
        APPMAP_CONFIGURATION: stringifyJSON(configuration),
      };
      logGuardWarning(
        recursive && recorder === "mocha",
        "The mocha recorder cannot recursively record processes.",
      );
      if (recursive || recorder === "mocha") {
        if (recorder === "mocha") {
          const hook = [
            "--require",
            pathifyURL(
              appendURLSegmentArray(directory, [
                "lib",
                "node",
                "recorder-mocha.mjs",
              ]),
              base,
              true,
            ),
          ];
          if (isMocha(command)) {
            argv = [...hook, ...argv];
          } else if (isNpxMocha(command)) {
            argv = ["--always-spawn", argv[0], ...hook, ...argv.slice(1)];
          } else if (isNpmMocha(command)) {
            argv = [argv[0], argv[1], ...hook, ...argv.slice(2)];
          } else if (isNodeMocha(command)) {
            argv = [argv[0], ...hook, ...argv.slice(1)];
          } else {
            expect(
              false,
              "The mocha recorder expected the command to start by either 'mocha' or 'npx mocha' or 'npm exec mocha', got %j %j.",
              exec,
              argv,
            );
          }
        }
        env = {
          ...env,
          NODE_OPTIONS: [
            coalesce(env, "NODE_OPTIONS", ""),
            // abomination: https://github.com/mochajs/mocha/issues/4720
            `--require=${pathifyURL(
              appendURLSegmentArray(directory, [
                "lib",
                "node",
                "abomination.js",
              ]),
              base,
              true,
            )}`,
            `--experimental-loader=${pathifyURL(
              appendURLSegmentArray(directory, [
                "lib",
                "node",
                recorder === "mocha"
                  ? "mocha-loader.mjs"
                  : `recorder-${recorder}.mjs`,
              ]),
              base,
              true,
            )}`,
          ].join(" "),
        };
      } else {
        logGuardWarning(
          exec !== "node",
          "Assuming %j is a node executable, recording will *not* happens if this is not the case.",
          exec,
        );
        argv = [
          "--experimental-loader",
          pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              `recorder-${recorder}.mjs`,
            ]),
            base,
            true,
          ),
          ...argv,
        ];
      }
      return {
        exec,
        argv,
        options: {
          ...options,
          cwd: new _URL(base),
          env,
        },
      };
    },
  };
};
