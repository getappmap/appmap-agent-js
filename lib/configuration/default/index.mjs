const { isArray, from: toArray } = Array;
const { fromEntries, entries } = Object;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: { identity, toAbsolutePath, hasOwnProperty },
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

  ///////////////
  // Normalize //
  ///////////////

  const generateNormalizeSplit = (separator, key1, key2) => (value) => {
    if (typeof value === "string") {
      const [head, ...tail] = value.split(separator);
      const { length } = tail;
      return {
        [key1]: head,
        [key2]: length === 0 ? null : tail.join(separator),
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

  // const normalizeConcurrency = (concurrency) => {
  //   if (typeof concurrency === 'string') {
  //     concurrency = parseInt(concurrency.substring(0, concurrency.length - 1));
  //     concurrency = floor((cpus * concurrency) / 100);
  //     concurrency = max(1, concurrency);
  //   }
  //   return concurrency;
  // };

  const normalizeHooks = (hooks, cwd) => {
    if (isArray(hooks)) {
      hooks = fromEntries(hooks.map((name) => [name, true]));
    }
    return hooks;
  };

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

  // const normalizeChilderen = (children) => children.flatMap(normalizeChild);

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
      normalize: identity,
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
      normalize: normalizeHooks,
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
      agent: extractRepositoryDependency(directory, "@appland/appmap-agent-js"),
      output: {
        directory: `${directory}/tmp/appmap`,
        filename: null,
        indent: null,
        postfix: ".appmap",
      },
      protocol: "tcp",
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
        name: 2020,
        version: "ecmascript",
      },
      engine: {
        name: null,
        version: null,
      },
      packages: [],
      exclude: [],
      recording: {
        "defined-class": null,
        "method-id": null,
      },
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
        toArray(entries(env))
          .filter(filterEnvironmentPair)
          .map(mapEnvironmentPair),
      ),
    extendConfiguration: (configuration, data, cwd) => {
      configuration = { ...configuration };
      for (let key of ownKeys(data)) {
        if (hasOwnProperty(fields, key)) {
          const { normalize, extend } = fields[key];
          configuration[key] = extend(
            configuration[key],
            normalize(data[key], cwd),
          );
        }
      }
      return configuration;
    },
  };
};
