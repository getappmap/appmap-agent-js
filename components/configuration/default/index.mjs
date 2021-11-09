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
    validate: { validateConfig },
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

  ////////////
  // export //
  ////////////

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
  };
};
