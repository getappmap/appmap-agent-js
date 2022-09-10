const {
  URL,
  RegExp,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

export default (dependencies) => {
  const {
    path: { getShell },
    util: { assert, coalesce },
    url: { pathifyURL, urlifyPath, appendURLSegmentArray },
    expect: { expect, expectSuccess },
    log: { logGuardWarning },
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

  /* c8 ignore start */
  const generateEscape = (shell) =>
    shell.endsWith("cmd") || shell.endsWith("cmd.exe")
      ? escapeCmdExe
      : escapeShell;
  const escapeCmdExe = (token) =>
    token.replace(/[^a-zA-Z0-9\-_./:@\\]/gu, "^$&");
  /* c8 ignore stop */

  const escapeShell = (token) => token.replace(/[^a-zA-Z0-9\-_./:@]/gu, "\\$&");
  const generateCommand = (shell, tokens) =>
    tokens.map(generateEscape(shell)).join(" ");

  const mocha_regexps = [
    /^(?<before>mocha)(?<after>($|\s[\s\S]*$))/u,
    /^(?<before>npx\s+mocha)(?<after>($|\s[\s\S]*$))/u,
    /^(?<before>npm\s+exec\s+mocha)(?<after>($|\s[\s\S]*$))/u,
  ];
  const splitMocha = (command) => {
    for (const regexp of mocha_regexps) {
      const result = regexp.exec(command);
      if (result !== null) {
        return result.groups;
      }
    }
    return null;
  };

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
              splitMocha(
                configuration.command.script === null
                  ? configuration.command.tokens.join(" ")
                  : configuration.command.script,
              ) === null
                ? "remote"
                : "mocha",
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
          engine: `node@${version.substring(1)}`,
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
    isConfigurationEnabled: ({ processes, main }) =>
      main === null || getSpecifierValue(processes, main),
    getConfigurationPackage: ({ packages }, url) =>
      getSpecifierValue(packages, url),
    getConfigurationScenarios: (configuration) => {
      const { scenarios, scenario } = configuration;
      const regexp = expectSuccess(
        () => new RegExp(scenario, "u"),
        "Scenario configuration field is not a valid regexp: %j >> %O",
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
        command: { base, script, tokens },
        recorder,
        "command-options": { shell, ...options },
        "recursive-process-recording": recursive,
        agent: { directory },
      } = configuration;
      env = {
        ...env,
        ...options.env,
        APPMAP_CONFIGURATION: stringifyJSON(configuration),
      };
      const [exec, ...flags] = shell === null ? getShell(env) : shell;
      let command = script === null ? generateCommand(exec, tokens) : script;
      logGuardWarning(
        recursive && recorder === "mocha",
        "The mocha recorder cannot recursively record processes.",
      );
      if (recursive || recorder === "mocha") {
        if (recorder === "mocha") {
          const groups = splitMocha(command);
          expect(
            groups !== null,
            "Could not parse the command %j as a mocha command",
            tokens,
          );
          command = `${groups.before} --require ${pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              "recorder-mocha.mjs",
            ]),
            base,
            true,
          )}${groups.after}`;
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
            `--experimental-loader=${generateEscape(exec)(
              pathifyURL(
                appendURLSegmentArray(directory, [
                  "lib",
                  "node",
                  recorder === "mocha"
                    ? "mocha-loader.mjs"
                    : `recorder-${recorder}.mjs`,
                ]),
                base,
                true,
              ),
            )}`,
          ].join(" "),
        };
      } else {
        const parts =
          /^(?<before>\s*\S*node(.[a-zA-Z]+)?)(?<after>($|\s[\s\S]*$))$/u.exec(
            command,
          );
        expect(
          parts !== null,
          "Could not find node exectuable in command %j",
          command,
        );
        command = `${
          parts.groups.before
        } --experimental-loader ${generateEscape(exec)(
          pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              `recorder-${recorder}.mjs`,
            ]),
            base,
            true,
          ),
        )}${parts.groups.after}`;
      }
      return {
        exec,
        argv: [...flags, command],
        options: {
          ...options,
          cwd: new URL(base),
          env,
        },
      };
    },
  };
};
