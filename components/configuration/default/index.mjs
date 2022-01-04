const { isArray } = Array;
const { ownKeys } = Reflect;
const { entries: toEntries } = Object;

const ANONYMOUS_NAME_SEPARATOR = "-";

export default (dependencies) => {
  const {
    util: { coalesce, assert, identity, hasOwnProperty },
    path: { toAbsolutePath },
    validate: { validateConfig },
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

  const normalizeExclusion = (exclusion, nullable_directory) => {
    if (typeof exclusion === "string") {
      exclusion = {
        "qualified-name": exclusion,
        recursive: true,
      };
    }
    const default_value = coalesce(exclusion, "combinator", "and") === "and";
    return {
      combinator: "and",
      "qualified-name": default_value,
      name: default_value,
      "every-label": default_value,
      "some-label": default_value,
      excluded: true,
      recursive: false,
      ...exclusion,
    };
  };

  const normalizeExclude = (exclusions, nullable_directory) =>
    exclusions.map(normalizeExclusion);

  const normalizeCommand = (command, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "cannot normalize command without directory",
    );
    return {
      value: command,
      cwd: nullable_directory,
    };
  };

  const normalizeScenarios = (scenarios, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "cannot normalize scenarios without reference directory",
    );
    return toEntries(scenarios).map(([key, value]) => ({
      cwd: nullable_directory,
      key,
      value,
    }));
  };

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
      {
        enabled,
        "inline-source": inline,
        shallow,
        exclude: exclude.map(normalizeExclusion),
      },
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
    agent: {
      extend: overwrite,
      normalize: identity,
    },
    repository: {
      extend: overwrite,
      normalize: identity,
    },
    scenario: {
      extend: overwrite,
      normalize: identity,
    },
    scenarios: {
      extend: overwrite,
      normalize: normalizeScenarios,
    },
    "recursive-process-recording": {
      extend: overwrite,
      normalize: identity,
    },
    command: {
      extend: overwrite,
      normalize: normalizeCommand,
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
      normalize: identity,
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
    "collapse-package-hierachy": {
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
      normalize: normalizeExclude,
    },
    recording: {
      extend: overwrite,
      normalize: normalizeRecording,
    },
    output: {
      extend: assign,
      normalize: normalizeOutput,
    },
    name: {
      extend: overwrite,
      normalize: identity,
    },
    "map-name": {
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

  return {
    createConfiguration: (home) => ({
      scenarios: [],
      scenario: "^",
      "recursive-process-recording": true,
      command: null,
      "command-options": {
        encoding: "utf8",
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
      },
      // overwritten by the agent
      agent: null,
      repository: {
        directory: home,
        history: null,
        package: null,
      },
      engine: null,
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
      "intercept-track-port": "^",
      "intercept-track-protocol": "HTTP/1.1",
      validate: {
        appmap: false,
        message: false,
      },
      log: "info",
      output: {
        directory: null,
        basename: null,
        extension: ".appmap.json",
      },
      processes: [
        [
          {
            cwd: home,
            source: "^",
            flags: "u",
          },
          true,
        ],
      ],
      recorder: null,
      "inline-source": false,
      hooks: {
        apply: true,
        esm: true,
        cjs: true,
        http: true,
        mysql: true,
        sqlite3: true,
        pg: true,
      },
      ordering: "causal",
      "function-name-placeholder": "()",
      "collapse-package-hierachy": false,
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
            cwd: home,
            source: "^",
            flags: "u",
          },
          {
            enabled: false,
            shallow: false,
            exclude: [],
            "inline-source": null,
          },
        ],
      ],
      "anonymous-name-separator": ANONYMOUS_NAME_SEPARATOR,
      exclude: [
        {
          combinator: "or",
          name: `^[^${ANONYMOUS_NAME_SEPARATOR}]*$`,
          "qualified-name": false,
          "every-label": false,
          "some-label": "^",
          excluded: false,
          recursive: false,
        },
        {
          combinator: "or",
          name: true,
          "qualified-name": true,
          "every-label": true,
          "some-label": true,
          excluded: true,
          recursive: false,
        },
      ],
      pruning: true,
      name: null,
      "map-name": null,
    }),
    extendConfiguration: (configuration, config, nullable_directory) => {
      configuration = { ...configuration };
      validateConfig(config);
      for (let key of ownKeys(config)) {
        const { normalize, extend } = fields[key];
        configuration[key] = extend(
          configuration[key],
          normalize(config[key], nullable_directory),
        );
      }
      return configuration;
    },
  };
};
