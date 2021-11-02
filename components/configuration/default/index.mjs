/* globals URL */

import { parse as parseShell } from "shell-quote";

const _URL = URL;
const { stringify: stringifyJSON } = JSON;
const { isArray } = Array;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: {
      generateDeadcode,
      coalesce,
      assert,
      identity,
      toAbsolutePath,
      hasOwnProperty,
    },
    log: { logInfo, logGuardWarning, logWarning },
    expect: { expect },
    validate: { validateConfig },
    specifier: { matchSpecifier },
    engine: { getEngine },
    repository: {
      extractRepositoryHistory,
      extractRepositoryPackage,
      extractRepositoryDependency,
    },
    specifier: { createSpecifier },
  } = dependencies;

  ////////////
  // Extend //
  ////////////

  const default_package_specifier = {
    enabled: true,
    "inline-source": null,
    shallow: false,
    exclude: [],
  };

  const assign = (value1, value2) => ({ ...value1, ...value2 });

  const overwrite = (value1, value2) => value2;

  // const append = (value1, value2) => [...value1, ...value2];

  const prepend = (value1, value2) => [...value2, ...value1];

  const toAbsolutePathFlip = (relative, absolute) =>
    toAbsolutePath(absolute, relative);

  const extendCommandOptions = (options1, options2) => ({
    ...options1,
    ...options2,
    env: {
      ...coalesce(options1, "env", {}),
      ...coalesce(options2, "env", {}),
    },
  });

  ///////////////
  // Normalize //
  ///////////////

  const normalizePort = (port, nullable_directory) => {
    if (typeof port === "string") {
      port = toAbsolutePath(nullable_directory, port);
    }
    return port;
  };

  const generateNormalizeSplit = (separator, key1, key2) => (value) => {
    if (typeof value === "string") {
      const [value1, value2] = value.split(separator);
      return {
        [key1]: value1,
        [key2]: value2,
      };
    }
    return value;
  };

  const normalizeRecording = generateNormalizeSplit(
    ".",
    "defined-class",
    "method-id",
  );

  const normalizeLanguage = generateNormalizeSplit("@", "name", "version");

  const normalizeEngine = generateNormalizeSplit("@", "name", "version");

  const normalizeFramework = generateNormalizeSplit("@", "name", "version");

  const normalizeFrameworkArray = (frameworks) =>
    frameworks.map(normalizeFramework);

  const normalizeSerialization = (serialization) => {
    if (typeof serialization === "string") {
      serialization = { method: serialization };
    }
    return serialization;
  };

  const normalizeOutput = (output, nullable_directory) => {
    if (typeof output === "string") {
      output = { directory: output };
    }
    if (hasOwnProperty(output, "directory")) {
      const { directory } = output;
      output = {
        ...output,
        directory: toAbsolutePath(nullable_directory, directory),
      };
    }
    return output;
  };

  const normalizePackageSpecifier = (specifier, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "extending packages configuration requires directory",
    );
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    }
    const {
      enabled,
      shallow,
      "inline-source": inline,
      exclude,
      ...rest
    } = {
      enabled: true,
      "inline-source": null,
      shallow: hasOwnProperty(specifier, "dist"),
      exclude: [],
      ...specifier,
    };
    return [
      createSpecifier(nullable_directory, rest),
      { enabled, "inline-source": inline, shallow, exclude },
    ];
  };

  const normalizePackages = (specifiers, nullable_directory) => {
    if (!isArray(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizePackageSpecifier(specifier, nullable_directory),
    );
  };

  const normalizeProcessSpecifier = (specifier, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "normalizing process elements requires a directory",
    );
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    } else if (typeof specifier === "boolean") {
      specifier = { regexp: "^", flags: "u", enabled: specifier };
    }
    const { enabled, ...rest } = {
      enabled: true,
      ...specifier,
    };
    return [createSpecifier(nullable_directory, rest), enabled];
  };

  const normalizeProcesses = (specifiers, nullable_directory) => {
    if (!isArray(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizeProcessSpecifier(specifier, nullable_directory),
    );
  };

  ////////////
  // fields //
  ////////////

  const fields = {
    scenario: {
      extend: overwrite,
      normalize: identity,
    },
    scenarios: {
      extend: generateDeadcode("scenarios should be manually extended"),
      normalize: generateDeadcode("scenarios should be manually normalized"),
    },
    "recursive-process-recording": {
      extend: overwrite,
      normalize: identity,
    },
    command: {
      extend: overwrite,
      normalize: identity,
    },
    "command-options": {
      extend: extendCommandOptions,
      normalize: identity,
    },
    validate: {
      extend: assign,
      normalize: identity,
    },
    log: {
      extend: overwrite,
      normalize: identity,
    },
    host: {
      extend: overwrite,
      normalize: identity,
    },
    session: {
      extend: overwrite,
      normalize: identity,
    },
    "trace-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "trace-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    "intercept-track-port": {
      extend: overwrite,
      normalize: normalizePort,
    },
    "intercept-track-protocol": {
      extend: overwrite,
      normalize: identity,
    },
    enabled: {
      extend: overwrite,
      normalize: identity,
    },
    processes: {
      extend: prepend,
      normalize: normalizeProcesses,
    },
    recorder: {
      extend: overwrite,
      normalize: identity,
    },
    "inline-source": {
      extend: overwrite,
      normalize: identity,
    },
    hooks: {
      extend: assign,
      normalize: identity,
    },
    ordering: {
      extend: overwrite,
      normalize: identity,
    },
    "function-name-placeholder": {
      extend: overwrite,
      normalize: identity,
    },
    serialization: {
      extend: assign,
      normalize: normalizeSerialization,
    },
    "hidden-identifier": {
      extend: overwrite,
      normalize: identity,
    },
    main: {
      extend: overwrite,
      normalize: toAbsolutePathFlip,
    },
    language: {
      extend: assign,
      normalize: normalizeLanguage,
    },
    engine: {
      extend: overwrite,
      normalize: normalizeEngine,
    },
    packages: {
      extend: prepend,
      normalize: normalizePackages,
    },
    exclude: {
      extend: prepend,
      normalize: identity,
    },
    recording: {
      extend: overwrite,
      normalize: normalizeRecording,
    },
    output: {
      extend: assign,
      normalize: normalizeOutput,
    },
    app: {
      extend: overwrite,
      normalize: identity,
    },
    name: {
      extend: overwrite,
      normalize: identity,
    },
    pruning: {
      extend: overwrite,
      normalize: identity,
    },
    labels: {
      extend: prepend,
      normalize: identity,
    },
    feature: {
      extend: overwrite,
      normalize: identity,
      initial: null,
    },
    "feature-group": {
      extend: overwrite,
      normalize: identity,
    },
    frameworks: {
      extend: prepend,
      normalize: normalizeFrameworkArray,
    },
  };

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

  ////////////
  // export //
  ////////////

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

  const extendConfiguration = (configuration, config, nullable_directory) => {
    configuration = { ...configuration };
    validateConfig(config);
    for (let key of ownKeys(config)) {
      if (key !== "scenarios") {
        const { normalize, extend } = fields[key];
        configuration[key] = extend(
          configuration[key],
          normalize(config[key], nullable_directory),
        );
      }
    }
    const parent_configuration = {
      ...configuration,
      scenarios: [],
    };
    configuration.scenarios = [
      ...configuration.scenarios,
      ...coalesce(config, "scenarios", []).map((config) =>
        extendConfiguration(parent_configuration, config, nullable_directory),
      ),
    ];
    return configuration;
  };

  return {
    createConfiguration: (directory) => ({
      scenarios: [],
      scenario: "^",
      "recursive-process-recording": true,
      command: null,
      "command-options": {
        encoding: "utf8",
        cwd: directory, // NB: defines cwd for exec
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
      },
      // defined at initialization (cannot be overwritten)
      agent: extractRepositoryDependency(directory, "@appland/appmap-agent-js"),
      repository: {
        directory,
        history: extractRepositoryHistory(directory),
        package: extractRepositoryPackage(directory),
      },
      engine: getEngine(),
      // overwritten by the agent
      labels: [],
      feature: null,
      "feature-group": null,
      frameworks: [],
      main: null,
      recording: null,
      // provided by the user
      host: "localhost",
      session: null,
      "trace-port": 0, // possibly overwritten by the agent
      "trace-protocol": "TCP",
      "track-port": 0, // possibly overwritten by the agent
      "track-protocol": "HTTP/1.1",
      "intercept-track-port": null,
      "intercept-track-protocol": "HTTP/1.1",
      validate: {
        appmap: false,
        message: false,
      },
      log: "info",
      output: {
        directory: `${directory}/tmp/appmap`,
        basename: null,
        extension: ".appmap.json",
      },
      processes: [
        [
          {
            basedir: directory,
            source: "^",
            flags: "u",
          },
          true,
        ],
      ],
      recorder: "process",
      "inline-source": false,
      hooks: {
        apply: true,
        esm: true,
        cjs: true,
        http: true,
        mysql: false,
        sqlite3: false,
        pg: false,
      },
      ordering: "chronological",
      "function-name-placeholder": "()",
      serialization: {
        "maximum-length": 96,
        "include-constructor-name": true,
        method: "toString",
      },
      "hidden-identifier": "APPMAP",
      language: {
        name: "ecmascript",
        version: "2020",
      },
      packages: [
        [
          {
            basedir: directory,
            source: "(^\\.\\.)|((^|/)node_modules/)",
            flags: "u",
          },
          {
            enabled: false,
            shallow: true,
            exclude: [],
            "inline-source": null,
          },
        ],
        [
          {
            basedir: directory,
            source: "^",
            flags: "u",
          },
          {
            enabled: true,
            shallow: false,
            exclude: [],
            "inline-source": null,
          },
        ],
      ],
      exclude: [],
      pruning: false,
      app: null,
      name: null,
    }),
    extendConfiguration,
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
      logInfo(`%s %s`, enabled ? "recording" : "bypassing", main);
      return enabled;
    },
    compileCommandConfiguration: (configuration, env) => {
      let { command } = configuration;
      assert(command !== null, "missing command in configuration");
      const {
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
          const hook = ["--require", `${directory}/lib/recorder-mocha.mjs`];
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
            `--require=${directory}/lib/abomination.js`,
            `--experimental-loader=${directory}/lib/${
              recorder === "mocha"
                ? "node-mocha-loader"
                : `recorder-${recorder}`
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
          `${directory}/lib/recorder-${recorder}.mjs`,
          ...tokens.slice(1),
        ]
          .map(quote)
          .join(" ");
      }
      return {
        command,
        options: {
          ...options,
          env,
        },
      };
    },
  };
};
