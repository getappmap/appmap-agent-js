const { from: toArray, isArray } = Array;
const { fromEntries, entries: toEntries } = Object;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: { assert, identity, toAbsolutePath, hasOwnProperty },
    validate: { validateConfiguration },
    engine: { getEngine },
    repository: {
      extractRepositoryHistory,
      extractRepositoryPackage,
      extractRepositoryDependency,
    },
    specifier: { createSpecifier },
    child: { createChildren },
  } = dependencies;

  ////////////
  // Extend //
  ////////////

  const assign = (value1, value2) => ({ ...value1, ...value2 });

  const overwrite = (value1, value2) => value2;

  // const append = (value1, value2) => [...value1, ...value2];

  const prepend = (value1, value2) => [...value2, ...value1];

  const isString = (any) => typeof any === "string";

  const toAbsolutePathFlip = (relative, absolute) =>
    toAbsolutePath(absolute, relative);

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
    const { enabled, shallow, source, exclude, ...rest } = {
      enabled: true,
      source: null,
      shallow: hasOwnProperty(specifier, "dist"),
      exclude: [],
      ...specifier,
    };
    return [
      createSpecifier(nullable_directory, rest),
      { enabled, source, shallow, exclude },
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

  const normalizeScenarios = (scenarios, nullable_directory) =>
    fromEntries(
      toArray(toEntries(scenarios)).map(([name, children]) => {
        assert(
          nullable_directory !== null,
          "normalizing scenarios elements requires a directory",
        );
        if (!isArray(children) || children.every(isString)) {
          children = [children];
        }
        return [
          name,
          children.flatMap((child) =>
            createChildren(child, nullable_directory),
          ),
        ];
      }),
    );

  const normalizeEnabledSpecifier = (specifier, nullable_directory) => {
    assert(
      nullable_directory !== null,
      "normalizing enabled elements requires a directory",
    );
    if (typeof specifier === "string") {
      specifier = { glob: specifier };
    } else if (typeof specifier === "boolean") {
      specifier = { regexp: "^", enabled: specifier };
    }
    const { enabled, ...rest } = {
      enabled: true,
      ...specifier,
    };
    return [createSpecifier(nullable_directory, rest), enabled];
  };

  const normalizeEnabled = (specifiers, nullable_directory) => {
    if (!isArray(specifiers)) {
      specifiers = [specifiers];
    }
    return specifiers.map((specifier) =>
      normalizeEnabledSpecifier(specifier, nullable_directory),
    );
  };

  ////////////
  // fields //
  ////////////

  const fields = {
    validate: {
      extend: assign,
      normalize: identity,
    },
    mode: {
      extend: overwrite,
      normalize: identity,
    },
    scenario: {
      extend: overwrite,
      normalize: identity,
    },
    scenarios: {
      extend: assign,
      normalize: normalizeScenarios,
    },
    log: {
      extend: overwrite,
      normalize: identity,
    },
    protocol: {
      extend: overwrite,
      normalize: identity,
    },
    host: {
      extend: overwrite,
      normalize: identity,
    },
    port: {
      extend: overwrite,
      normalize: normalizePort,
    },
    enabled: {
      extend: prepend,
      normalize: normalizeEnabled,
    },
    recorder: {
      extend: overwrite,
      normalize: identity,
    },
    source: {
      extend: overwrite,
      normalize: identity,
    },
    hooks: {
      extend: assign,
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

  const filterEnvironmentPair = ([key, value]) =>
    key.toLowerCase().startsWith("appmap_");

  const mapEnvironmentPair = ([key, value]) => [
    key.toLowerCase().substring(7).replace(/_/g, "-"),
    value,
  ];

  ////////////
  // export //
  ////////////

  return {
    createConfiguration: (directory) => ({
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
      mode: "local",
      protocol: "tcp",
      host: "localhost",
      port: 0, // possibly overwritten by the agent
      validate: {
        appmap: false,
        message: false,
      },
      scenario: "anonymous",
      scenarios: {},
      log: "info",
      output: {
        directory: `${directory}/tmp/appmap`,
        filename: null,
        indent: 0,
        postfix: ".appmap",
      },
      enabled: [],
      recorder: "process",
      source: false,
      hooks: {
        apply: true,
        esm: true,
        cjs: true,
        http: true,
        mysql: false,
        sqlite3: false,
        pg: false,
      },
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
      packages: [],
      exclude: [],
      pruning: false,
      app: null,
      name: null,
    }),
    extractEnvironmentConfiguration: (env) =>
      fromEntries(
        toArray(toEntries(env))
          .filter(filterEnvironmentPair)
          .map(mapEnvironmentPair),
      ),
    extendConfiguration: (configuration, data, nullable_directory) => {
      configuration = { ...configuration };
      validateConfiguration(data);
      for (let key of ownKeys(data)) {
        const { normalize, extend } = fields[key];
        configuration[key] = extend(
          configuration[key],
          normalize(data[key], nullable_directory),
        );
      }
      return configuration;
    },
  };
};
