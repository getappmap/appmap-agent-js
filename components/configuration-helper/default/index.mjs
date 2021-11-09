/* globals URL */

import YAML from "yaml";
import { parse as parseShell } from "shell-quote";

const { parse: parseYAML } = YAML;
const { parse: parseJSON } = JSON;
const _URL = URL;
const { stringify: stringifyJSON } = JSON;

export default (dependencies) => {
  const {
    log: { logInfo, logGuardWarning, logWarning },
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

  const generateExtend = (parse) => (configuration, content, path) =>
    extendConfiguration(
      configuration,
      expectSuccess(
        () => parse(content),
        "Could not parse configuration string >> %e",
      ),
      path,
    );

  // const filterEnvironmentPair = ([key, value]) =>
  //   key.toLowerCase().startsWith("appmap_");
  //
  // const mapEnvironmentPair = ([key, value]) => [
  //   key.toLowerCase().substring(7).replace(/_/g, "-"),
  //   value,
  // ];

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
    getConfigurationPackage: (packages, url) => {
      const { protocol, pathname } = new _URL(url);
      if (protocol === "data:") {
        logWarning(
          "Could not apply 'packages' configuration field on package url because it is a data url, got: %j.",
          url,
        );
        return default_package_specifier;
      }
      return getSpecifierValue(packages, pathname);
    },
    isConfigurationEnabled: ({ processes, main }) => {
      const enabled = main === null || getSpecifierValue(processes, main);
      logInfo(`%s %s.`, enabled ? "Recording" : "Bypassing", main);
      return enabled;
    },
    extendConfigurationJSON: generateExtend(parseJSON),
    extendConfigurationYAML: generateExtend(parseYAML),
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
    compileCommandConfiguration: (configuration, env) => {
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
