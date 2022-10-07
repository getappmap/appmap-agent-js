const {
  URL,
  Array: { isArray },
  Reflect: { ownKeys },
  Object: { entries: toEntries },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logGuardInfo } = await import(`../../log/index.mjs${__search}`);
const { hasOwnProperty, coalesce, identity } = await import(
  `../../util/index.mjs${__search}`
);
const { urlifyPath } = await import(`../../url/index.mjs${__search}`);
const { validateExternalConfiguration } = await import(
  `../../validate/index.mjs${__search}`
);
const { createSpecifier } = await import(
  `../../specifier/index.mjs${__search}`
);

const HOOK_ESM_GLOBAL = "APPMAP_HOOK_ESM";

const HOOK_APPLY_GLOBAL = "APPMAP_HOOK_APPLY";

const HOOK_EVAL_GLOBAL = "APPMAP_HOOK_EVAL";

const ANONYMOUS_NAME_SEPARATOR = "-";

const EXPECTED_EXTRA_PROPERTIES = ["test_recording"];

////////////
// Extend //
////////////

const assign = (value1, value2) => ({ ...value1, ...value2 });

const overwrite = (_value1, value2) => value2;

// const append = (value1, value2) => [...value1, ...value2];

const prepend = (value1, value2) => [...value2, ...value1];

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

const normalizeExclusion = (exclusion, _base) => {
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

const normalizeHooks = (hooks, _base) => {
  if (hasOwnProperty(hooks, "eval")) {
    hooks.eval =
      typeof hooks.eval === "boolean"
        ? {
            hidden: HOOK_EVAL_GLOBAL,
            aliases: hooks.eval ? ["eval"] : [],
          }
        : hooks.eval;
  }
  if (hasOwnProperty(hooks, "esm")) {
    hooks.esm =
      typeof hooks.esm === "boolean"
        ? hooks.esm
          ? HOOK_ESM_GLOBAL
          : null
        : hooks.esm;
  }
  if (hasOwnProperty(hooks, "apply")) {
    hooks.apply =
      typeof hooks.apply === "boolean"
        ? hooks.apply
          ? HOOK_APPLY_GLOBAL
          : null
        : hooks.apply;
  }
  return hooks;
};

const normalizeExclude = (exclusions, _base) =>
  exclusions.map(normalizeExclusion);

const normalizeCommand = (command, base) => ({
  base,
  script: typeof command === "string" ? command : null,
  tokens: typeof command === "string" ? null : command,
});

const normalizeScenarios = (scenarios, base) =>
  toEntries(scenarios).map(([key, value]) => ({
    base,
    key,
    value,
  }));

const normalizeLog = (log, base) => {
  if (typeof log === "string") {
    log = { level: log };
  }
  if (hasOwnProperty(log, "file") && typeof log.file !== "number") {
    log.file = urlifyPath(log.file, base);
  }
  return log;
};

const normalizePort = (port, base) => {
  if (typeof port === "string" && port !== "") {
    port = urlifyPath(port, base);
  }
  return port;
};

const generateNormalizeSplit = (separator, key1, key2) => (value) => {
  if (typeof value === "string") {
    const segments = value.split(separator);
    return {
      [key1]: segments[0],
      [key2]: segments.length === 1 ? null : segments[1],
    };
  }
  return value;
};

const normalizeRecording = generateNormalizeSplit(
  ".",
  "defined-class",
  "method-id",
);

const normalizeFramework = generateNormalizeSplit("@", "name", "version");

const normalizeFrameworkArray = (frameworks) =>
  frameworks.map(normalizeFramework);

const normalizePackageSpecifier = (specifier, base) => {
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
    createSpecifier(rest, base),
    {
      enabled,
      "inline-source": inline,
      shallow,
      exclude: exclude.map(normalizeExclusion),
    },
  ];
};

const normalizePackages = (specifiers, base) => {
  if (!isArray(specifiers)) {
    specifiers = [specifiers];
  }
  return specifiers.map((specifier) =>
    normalizePackageSpecifier(specifier, base),
  );
};

const normalizeProcessSpecifier = (specifier, base) => {
  if (typeof specifier === "string") {
    specifier = { glob: specifier };
  } else if (typeof specifier === "boolean") {
    specifier = { regexp: "^", flags: "u", enabled: specifier };
  }
  const { enabled, ...rest } = {
    enabled: true,
    ...specifier,
  };
  return [createSpecifier(rest, base), enabled];
};

const normalizeProcesses = (specifiers, base) => {
  if (!isArray(specifiers)) {
    specifiers = [specifiers];
  }
  return specifiers.map((specifier) =>
    normalizeProcessSpecifier(specifier, base),
  );
};

////////////
// fields //
////////////

const fields = {
  socket: {
    extend: overwrite,
    normalize: identity,
  },
  heartbeat: {
    extend: overwrite,
    normalize: identity,
  },
  threshold: {
    extend: overwrite,
    normalize: identity,
  },
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
    extend: assign,
    normalize: normalizeLog,
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
    normalize: normalizeHooks,
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
    normalize: identity,
  },
  main: {
    extend: overwrite,
    normalize: urlifyPath,
  },
  language: {
    extend: overwrite,
    normalize: identity,
  },
  engine: {
    extend: overwrite,
    normalize: identity,
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
  appmap_dir: {
    extend: overwrite,
    normalize: urlifyPath,
  },
  appmap_file: {
    extend: overwrite,
    normalize: identity,
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

export const createConfiguration = (home) => ({
  scenarios: [],
  scenario: "^",
  "recursive-process-recording": true,
  command: null,
  "command-options": {
    shell: null,
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
  socket: "unix",
  heartbeat: 1000,
  threshold: 100,
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
  log: {
    level: "error",
    file: 2,
  },
  appmap_dir: urlifyPath("tmp/appmap", home),
  appmap_file: null,
  processes: [[true, true]],
  recorder: null,
  "inline-source": false,
  hooks: {
    apply: HOOK_APPLY_GLOBAL,
    eval: {
      hidden: HOOK_EVAL_GLOBAL,
      aliases: [],
    },
    esm: HOOK_ESM_GLOBAL,
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
    "maximum-print-length": 100,
    "maximum-properties-length": 10,
    "impure-printing": true,
    "impure-constructor-naming": true,
    "impure-array-inspection": true,
    "impure-error-inspection": true,
    "impure-hash-inspection": true,
  },
  language: "javascript",
  packages: [
    [
      true,
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
});

export const extendConfiguration = (
  internal_configuration,
  external_configuration,
  base,
) => {
  const extended_internal_configuration = { ...internal_configuration };
  validateExternalConfiguration(external_configuration);
  for (const key of ownKeys(external_configuration)) {
    if (hasOwnProperty(fields, key)) {
      const { normalize, extend } = fields[key];
      extended_internal_configuration[key] = extend(
        extended_internal_configuration[key],
        normalize(external_configuration[key], base),
      );
    } else {
      logGuardInfo(
        !EXPECTED_EXTRA_PROPERTIES.includes(key),
        "Configuration property not recognized by the agent: %j",
        key,
      );
    }
  }
  return extended_internal_configuration;
};
