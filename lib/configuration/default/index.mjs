const { isArray } = Array;
const { fromEntries } = Object;
const { ownKeys } = Reflect;

export default (dependencies) => {
  const {
    util: { identity, toAbsolutePath, hasOwnProperty },
    repository: {
      extractRepositoryHistory,
      extractRepositoryPackage,
      extractRepositoryDependencyPackage,
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

  const normalizeFrameworksHelper = generateNormalizeSplit(
    "@",
    "name",
    "version",
  );
  const normalizeFrameworks = (frameworks) =>
    frameworks.map(normalizeFrameworksHelper);

  const normalizeObjectName = (name) => {
    if (typeof name === "string") {
      name = { name };
    }
    return name;
  };

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

  const normalizeMain = (main, cwd) => {
    if (typeof main === "string") {
      main = { path: main };
    }
    let { path } = main;
    if (path !== null) {
      path = toAbsolutePath(cwd, path);
    }
    return { path };
  };

  const normalizeRecorder = (recorder, cwd) => {
    if (typeof recorder === "string") {
      recorder = { name: recorder };
    }
    return recorder;
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
      normalize: normalizeRecorder,
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
      normalize: normalizeMain,
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
      extend: assign,
      normalize: normalizeObjectName,
    },
    map: {
      extend: assign,
      normalize: normalizeObjectName,
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
      normalize: normalizeFrameworks,
    },
  };

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
      agent: {
        package: extractRepositoryDependencyPackage(
          directory,
          "appmap-agent-js",
        ),
      },
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
      recorder: "normal",
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
      main: {
        path: null,
      },
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
      app: { name: null },
      map: { name: null },
      labels: [],
      feature: null,
      "feature-group": null,
      frameworks: [],
    }),
    extendConfiguration: (config, data, cwd) => {
      config = { ...config };
      for (let key of ownKeys(data)) {
        if (hasOwnProperty(fields, key)) {
          const { normalize, extend } = fields[key];
          config[key] = extend(config[key], normalize(data[key], cwd));
        }
      }
      return config;
    },
  };
};
