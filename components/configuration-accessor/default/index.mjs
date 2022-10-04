const {
  Error,
  URL,
  RegExp,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { getShell } = await import(`../../path/index.mjs${__search}`);
const { assert, coalesce } = await import(`../../util/index.mjs${__search}`);
const { pathifyURL, urlifyPath, appendURLSegmentArray } = await import(
  `../../url/index.mjs${__search}`
);
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);
const { logGuardWarning } = await import(`../../log/index.mjs${__search}`);
const {
  extractRepositoryDependency,
  extractRepositoryHistory,
  extractRepositoryPackage,
} = await import(`../../repository/index.mjs${__search}`);
const { matchSpecifier } = await import(`../../specifier/index.mjs${__search}`);
const { extendConfiguration } = await import(
  `../../configuration/index.mjs${__search}`
);

const getSpecifierValue = (pairs, key) => {
  for (const [specifier, value] of pairs) {
    if (matchSpecifier(specifier, key)) {
      return value;
    }
  }
  /* c8 ignore start */
  throw new Error("missing matching specifier");
  /* c8 ignore stop */
};

const escapeShell = (token) => token.replace(/[^a-zA-Z0-9\-_./:@]/gu, "\\$&");

/* c8 ignore start */
const escapeCmdExe = (token) => token.replace(/[^a-zA-Z0-9\-_./:@\\]/gu, "^$&");
const generateEscape = (shell) =>
  shell.endsWith("cmd") || shell.endsWith("cmd.exe")
    ? escapeCmdExe
    : escapeShell;
/* c8 ignore stop */

const generateCommand = (shell, tokens) =>
  tokens.map(generateEscape(shell)).join(" ");

const mocha_regexps = [
  /^(?<before>mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npx\s+mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npm\s+exec\s+mocha)(?<after>($|\s[\s\S]*$))/u,
];

const splitMocha = (command) => {
  for (const regexp of mocha_regexps) {
    const result = regexp.exec(command);
    if (result !== null) {
      return result.groups;
    }
  }
  return null;
};

export const resolveConfigurationRepository = (configuration) => {
  assert(configuration.agent === null, "duplicate respository resolution");
  const { directory } = configuration.repository;
  return extendConfiguration(
    configuration,
    {
      agent: extractRepositoryDependency(directory, [
        "@appland",
        "appmap-agent-js",
      ]),
      repository: {
        directory,
        history: extractRepositoryHistory(directory),
        package: extractRepositoryPackage(directory),
      },
    },
    directory,
  );
};

export const resolveConfigurationAutomatedRecorder = (configuration) => {
  if (configuration.recorder === null) {
    assert(
      configuration.command !== null,
      "cannot resolve recorder because command is missing",
    );
    configuration = extendConfiguration(
      configuration,
      {
        recorder:
          splitMocha(
            configuration.command.script === null
              ? configuration.command.tokens.join(" ")
              : configuration.command.script,
          ) === null
            ? "remote"
            : "mocha",
      },
      configuration.repository.directory,
    );
  }
  return configuration;
};

export const resolveConfigurationManualRecorder = (configuration) => {
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
  return extendConfiguration(
    configuration,
    {
      recorder: "manual",
      hooks: {
        esm: false,
      },
    },
    configuration.repository.directory,
  );
};

export const extendConfigurationNode = (
  configuration,
  { version, argv, cwd },
) => {
  assert(argv.length >= 2, "expected at least two argv");
  const [, main] = argv;
  assert(version.startsWith("v"), "expected version to start with v");
  return extendConfiguration(
    configuration,
    {
      engine: `node@${version.substring(1)}`,
      main,
    },
    urlifyPath(cwd(), configuration.repository.directory),
  );
};

export const extendConfigurationPort = (configuration, ports) => {
  for (const [key, new_port] of toEntries(ports)) {
    const { [key]: old_port } = configuration;
    if (old_port === 0 || old_port === "") {
      assert(typeof new_port === typeof old_port, "port type mismatch");
      configuration = extendConfiguration(
        configuration,
        { [key]: new_port },
        configuration.repository.directory,
      );
    } else {
      assert(old_port === new_port);
    }
  }
  return configuration;
};

export const isConfigurationEnabled = ({ processes, main }) =>
  main === null || getSpecifierValue(processes, main);

export const getConfigurationPackage = ({ packages }, url) =>
  getSpecifierValue(packages, url);

export const getConfigurationScenarios = (configuration) => {
  const { scenarios, scenario } = configuration;
  const regexp = expectSuccess(
    () => new RegExp(scenario, "u"),
    "Scenario configuration field is not a valid regexp: %j >> %O",
    scenario,
  );
  return scenarios
    .filter(({ key }) => regexp.test(key))
    .map(({ base, value }) =>
      extendConfiguration(configuration, { scenarios: {}, ...value }, base),
    );
};

export const compileConfigurationCommand = (configuration, env) => {
  assert(configuration.agent !== null, "missing agent in configuration");
  assert(configuration.command !== null, "missing command in configuration");
  const {
    command: { base, script, tokens },
    recorder,
    "command-options": { shell, ...options },
    "recursive-process-recording": recursive,
    agent: { directory },
  } = configuration;
  env = {
    ...env,
    ...options.env,
    APPMAP_CONFIGURATION: stringifyJSON(configuration),
  };
  const [exec, ...flags] = shell === null ? getShell(env) : shell;
  let command = script === null ? generateCommand(exec, tokens) : script;
  logGuardWarning(
    recursive && recorder === "mocha",
    "The mocha recorder cannot recursively record processes.",
  );
  if (recursive || recorder === "mocha") {
    if (recorder === "mocha") {
      const groups = splitMocha(command);
      expect(
        groups !== null,
        "Could not parse the command %j as a mocha command",
        tokens,
      );
      command = `${groups.before} --require ${pathifyURL(
        appendURLSegmentArray(directory, ["lib", "node", "recorder-mocha.mjs"]),
        base,
        true,
      )}${groups.after}`;
    }
    env = {
      ...env,
      NODE_OPTIONS: [
        coalesce(env, "NODE_OPTIONS", ""),
        // abomination: https://github.com/mochajs/mocha/issues/4720
        `--require=${pathifyURL(
          appendURLSegmentArray(directory, ["lib", "node", "abomination.js"]),
          base,
          true,
        )}`,
        `--experimental-loader=${generateEscape(exec)(
          pathifyURL(
            appendURLSegmentArray(directory, [
              "lib",
              "node",
              recorder === "mocha"
                ? "mocha-loader.mjs"
                : `recorder-${recorder}.mjs`,
            ]),
            base,
            true,
          ),
        )}`,
      ].join(" "),
    };
  } else {
    const parts =
      /^(?<before>\s*\S*node(.[a-zA-Z]+)?)(?<after>($|\s[\s\S]*$))$/u.exec(
        command,
      );
    expect(
      parts !== null,
      "Could not find node exectuable in command %j",
      command,
    );
    command = `${parts.groups.before} --experimental-loader ${generateEscape(
      exec,
    )(
      pathifyURL(
        appendURLSegmentArray(directory, [
          "lib",
          "node",
          `recorder-${recorder}.mjs`,
        ]),
        base,
        true,
      ),
    )}${parts.groups.after}`;
  }
  return {
    exec,
    argv: [...flags, command],
    options: {
      ...options,
      cwd: new URL(base),
      env,
    },
  };
};
