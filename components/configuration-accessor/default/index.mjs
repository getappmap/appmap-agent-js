/* globals URL */

import ShellQuote from "shell-quote";

const { parse: parseShell } = ShellQuote;

const _URL = URL;
const _RegExp = RegExp;
const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    log: { logDebug, logInfo, logGuardWarning, logWarning },
    expect: { expect, expectSuccess },
    specifier: { matchSpecifier },
    configuration: { extendConfiguration },
    util: { assert, coalesce, toAbsolutePath },
  } = dependencies;

  const default_package_specifier = {
    enabled: true,
    "inline-source": null,
    shallow: false,
    exclude: [],
  };

  // const filterEnvironmentPair = ([key, value]) =>
  //   key.toLowerCase().startsWith("appmap_");
  //
  // const mapEnvironmentPair = ([key, value]) => [
  //   key.toLowerCase().substring(7).replace(/_/g, "-"),
  //   value,
  // ];

  const getSpecifierValue = (pairs, key) => {
    for (let index = 0; index < pairs.length; index += 1) {
      const [specifier, value] = pairs[index];
      const matched = matchSpecifier(specifier, key);
      // TODO: this breaks encapsulation
      const { cwd, pattern, flags } = specifier;
      logDebug(
        "Specifier #%j (pattern = %j, flags = %j) %s path $j relative to %j.",
        index,
        pattern,
        flags,
        matched ? "matched" : "did not match",
        key,
        cwd,
      );
      if (matched) {
        return value;
      }
    }
    /* c8 ignore start */
    assert(false, "missing matching specifier");
    /* c8 ignore stop */
  };

  const quote = (token) => {
    if (typeof token === "object") {
      const { op } = token;
      if (op === "glob") {
        const { pattern } = token;
        return pattern;
      }
      return op;
    }
    return `'${token.replace(/'/gu, "\\'")}'`;
  };

  return {
    // extractEnvironmentConfiguration: (env) =>
    //   fromEntries(
    //     toArray(toEntries(env))
    //       .filter(filterEnvironmentPair)
    //       .map(mapEnvironmentPair),
    //   ),
    getConfigurationPackage: ({ packages }, url) => {
      const { protocol, pathname } = new _URL(url);
      if (protocol === "data:") {
        logWarning(
          "Could not apply 'packages' configuration field on package url because it is a data url, got: %j.",
          url,
        );
        return default_package_specifier;
      }
      const options = getSpecifierValue(packages, pathname);
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
        .map(({ cwd, value }) =>
          extendConfiguration(configuration, { scenarios: {}, ...value }, cwd),
        );
    },
    initializeConfiguration: (configuration, agent, repository) => {
      assert(
        configuration.agent === null,
        "duplicate configuration initialization",
      );
      assert(
        configuration.repository.directory === repository.directory,
        "repository directory mismatch",
      );
      return extendConfiguration(configuration, { agent, repository }, null);
    },
    sanitizeConfigurationManual: (configuration) => {
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
      return extendConfiguration(configuration, {
        recorder: "manual",
        hooks: {
          esm: false,
        },
      });
    },
    resolveConfigurationPort: (configuration, trace_port, track_port) => {
      for (const [key, value1] of [
        ["trace-port", trace_port],
        ["track-port", track_port],
      ]) {
        const { [key]: value2 } = configuration;
        if (value2 === 0) {
          assert(typeof value1 === "number", "expected a port number");
          configuration = extendConfiguration(
            configuration,
            { [key]: value1 },
            null,
          );
        } else {
          assert(value1 === value2, "port mismatch");
        }
      }
      return configuration;
    },
    isConfigurationEnabled: ({ processes, main }) => {
      const enabled = main === null || getSpecifierValue(processes, main);
      logInfo(`%s %s.`, enabled ? "Recording" : "Bypassing", main);
      return enabled;
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
          main: toAbsolutePath(cwd(), main),
        },
        null,
      );
    },
    resolveConfigurationRecorder: (configuration) => {
      if (configuration.recorder === null) {
        assert(
          configuration.command !== null,
          "cannot resolve recorder because command is missing",
        );
        configuration = extendConfiguration(
          configuration,
          {
            recorder: configuration.command.value.includes("mocha")
              ? "mocha"
              : "remote",
          },
          null,
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
    compileConfigurationCommand: (configuration, env) => {
      assert(configuration.agent !== null, "missing agent in configuration");
      assert(
        configuration.command !== null,
        "missing command in configuration",
      );
      let {
        command: { value: command },
      } = configuration;
      const {
        command: { cwd },
        recorder,
        "command-options": options,
        "recursive-process-recording": recursive,
        agent: { directory },
      } = configuration;
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
          let tokens = parseShell(command, env);
          const hook = [
            "--require",
            `${directory}/lib/node/recorder-mocha.mjs`,
          ];
          if (tokens.length > 0 && tokens[0] === "mocha") {
            tokens = ["mocha", ...hook, ...tokens.slice(1)];
          } else if (
            tokens.length > 1 &&
            tokens[0] === "npx" &&
            tokens[1] === "mocha"
          ) {
            tokens = [
              "npx",
              "--always-spawn",
              "mocha",
              ...hook,
              ...tokens.slice(2),
            ];
          } else {
            expect(
              false,
              "The mocha recorder expected the command to start by either 'mocha' or 'npx mocha', got %j.",
              tokens,
            );
          }
          command = tokens.map(quote).join(" ");
        }
        env = {
          ...env,
          NODE_OPTIONS: [
            coalesce(env, "NODE_OPTIONS", ""),
            // abomination: https://github.com/mochajs/mocha/issues/4720
            `--require=${directory}/lib/node/abomination.js`,
            `--experimental-loader=${directory}/lib/node/${
              recorder === "mocha" ? "mocha-loader" : `recorder-${recorder}`
            }.mjs`,
          ].join(" "),
        };
      } else {
        const tokens = parseShell(command, env);
        expect(
          tokens.length > 0,
          "Could not find executable from command: %j.",
          command,
        );
        logGuardWarning(
          tokens[0] !== "node",
          "Assuming %j is a node executable, recording will *not* happens if this is not the case.",
          tokens[0],
        );
        command = [
          tokens[0],
          "--experimental-loader",
          `${directory}/lib/node/recorder-${recorder}.mjs`,
          ...tokens.slice(1),
        ]
          .map(quote)
          .join(" ");
      }
      return {
        command,
        options: {
          ...options,
          cwd,
          env,
        },
      };
    },
  };
};
