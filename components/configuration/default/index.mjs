const { from: toArray, isArray } = Array;
const { fromEntries, entries: toEntries } = Object;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: { identity, toAbsolutePath, hasOwnProperty },
    validate: { validateConfiguration },
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

  const normalizePort = (port, cwd) => {
    if (typeof port === "string") {
      port = toAbsolutePath(cwd, port);
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

  const normalizeOutput = (output, cwd) => {
    if (typeof output === "string") {
      output = { directory: output };
    }
    if (hasOwnProperty(output, "directory")) {
      const { directory } = output;
      return {
        ...output,
        directory: toAbsolutePath(cwd, directory),
      };
    }
    return output;
  };

  const normalizePackageSpecifier = (specifier, cwd) => {
    if (typeof specifier === "string") {
      specifier = { path: specifier };
    }
    const { enabled, shallow, source, exclude, ...rest } = {
      enabled: true,
      source: null,
      shallow: hasOwnProperty(specifier, "dist"),
      exclude: [],
      ...specifier,
    };
    return [createSpecifier(cwd, rest), { enabled, source, shallow, exclude }];
  };

  const normalizePackages = (specifiers, cwd) =>
    specifiers.map((specifier) => normalizePackageSpecifier(specifier, cwd));

  const normalizeScenarios = (scenarios, cwd) =>
    fromEntries(
      toArray(toEntries(scenarios)).map(([name, children]) => {
        if (!isArray(children) || children.every(isString)) {
          children = [children];
        }
        return [name, children.flatMap((child) => createChildren(child, cwd))];
      }),
    );

  const normalizeEnabledSpecifier = (specifier, cwd) => {
    if (typeof specifier === "string") {
      specifier = { path: specifier };
    }
    const { enabled, ...rest } = {
      enabled: true,
      ...specifier,
    };
    return [createSpecifier(cwd, rest), enabled];
  };

  const normalizeEnabled = (specifiers, cwd) => {
    if (typeof specifiers === "boolean") {
      return [[createSpecifier(cwd, { regexp: "^" }), specifiers]];
    }
    return specifiers.map((specifier) =>
      normalizeEnabledSpecifier(specifier, cwd),
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
      extend: assign,
      normalize: normalizeScenarios,
    },
    "log-level": {
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
      normalize: identity,
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
      repository: {
        directory,
        history: extractRepositoryHistory(directory),
        package: extractRepositoryPackage(directory),
      },
      scenario: "anonymous",
      scenarios: {},
      "log-level": "warning",
      agent: extractRepositoryDependency(directory, "@appland/appmap-agent-js"),
      output: {
        directory: `${directory}/tmp/appmap`,
        filename: null,
        indent: 0,
        postfix: ".appmap",
      },
      protocol: "inline",
      host: "localhost",
      port: 0,
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
        "maximum-length": 100,
        "include-constructor-name": true,
        method: "toString",
      },
      "hidden-identifier": "APPMAP",
      main: null,
      language: {
        name: "ecmascript",
        version: "2020",
      },
      engine: null,
      packages: [],
      exclude: [],
      recording: null,
      pruning: false,
      app: null,
      name: null,
      labels: [],
      feature: null,
      "feature-group": null,
      frameworks: [],
    }),
    extractEnvironmentConfiguration: (env) =>
      fromEntries(
        toArray(toEntries(env))
          .filter(filterEnvironmentPair)
          .map(mapEnvironmentPair),
      ),
    extendConfiguration: (configuration, data, cwd) => {
      configuration = { ...configuration };
      validateConfiguration(data);
      for (let key of ownKeys(data)) {
        const { normalize, extend } = fields[key];
        configuration[key] = extend(
          configuration[key],
          normalize(data[key], cwd),
        );
      }
      return configuration;
    },
  };
};
