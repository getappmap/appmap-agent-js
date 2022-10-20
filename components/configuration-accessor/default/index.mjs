const {
  URL,
  RegExp,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import { readFileSync } from "node:fs";
const { toAbsoluteUrl } = await import(`../../url/index.mjs${__search}`);
const {
  toDirectoryPath,
  convertFileUrlToPath,
  convertPathToFileUrl,
  getShell,
  toAbsolutePath,
} = await import(`../../path/index.mjs${__search}`);
const { assert, coalesce, generateDeadcode } = await import(
  `../../util/index.mjs${__search}`
);
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);
const { logGuardWarning } = await import(`../../log/index.mjs${__search}`);
const { extractRepositoryHistory, extractRepositoryPackage } = await import(
  `../../repository/index.mjs${__search}`
);
const { matchSpecifier } = await import(`../../specifier/index.mjs${__search}`);
const { extendConfiguration } = await import(
  `../../configuration/index.mjs${__search}`
);

const getSpecifierValue = (pairs, key, def) => {
  for (const [specifier, value] of pairs) {
    if (matchSpecifier(specifier, key)) {
      return value;
    }
  }
  return def;
};

const escapePosix = (token) => token.replace(/[^a-zA-Z0-9\-_./:]/gu, "\\$&");

// https://ss64.com/nt/syntax-esc.html
const escapeWin32 = (token) => token.replace(/[^a-zA-Z0-9\-_./:\\]/gu, "^$&");

const escapeDead = generateDeadcode("escape without shell");

const generateEscape = (shell, env) => {
  if (shell === false) {
    return escapeDead;
  } else {
    if (shell === true) {
      shell = getShell(env);
    }
    return shell.endsWith("cmd") || shell.endsWith("cmd.exe")
      ? escapeWin32
      : escapePosix;
  }
};

const mocha_regexp_array = [
  /^(?<before>mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npx\s+mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npm\s+exec\s+mocha)(?<after>($|\s[\s\S]*$))/u,
];

const parseMochaCommand = (source) => {
  for (const regexp of mocha_regexp_array) {
    const result = regexp.exec(source);
    if (result !== null) {
      return result.groups;
    }
  }
  return expect(false, "Could not parse %j as a mocha command", source);
};

const mocha_prefix_array = [
  ["mocha"],
  ["npx", "mocha"],
  ["npm", "exec", "mocha"],
];

const isPrefixArray = (prefix, array) => {
  const { length } = prefix;
  if (length > array.length) {
    return false;
  } else {
    for (let index = 0; index < length; index += 1) {
      if (prefix[index] !== array[index]) {
        return false;
      }
    }
    return true;
  }
};

const splitMochaCommand = (tokens) => {
  for (const prefix of mocha_prefix_array) {
    if (isPrefixArray(prefix, tokens)) {
      return {
        before: prefix,
        after: tokens.slice(prefix.length),
      };
    }
  }
  return expect(false, "Could not recognize %j as a mocha command", tokens);
};

const parseNodeCommand = (source) => {
  const result =
    /^(?<before>\s*\S*node(.[a-zA-Z]+)?)(?<after>($|\s[\s\S]*$))$/u.exec(
      source,
    );
  expect(result !== null, "Could not parse %j as a node command", source);
  return result.groups;
};

const splitNodeCommand = (tokens) => {
  expect(
    tokens.length > 0 && tokens[0].startsWith("node"),
    "Could not recognize %j as a node command",
    tokens,
  );
  return {
    before: tokens.slice(0, 1),
    after: tokens.slice(1),
  };
};

export const resolveConfigurationRepository = (configuration) => {
  assert(configuration.agent === null, "duplicate respository resolution");
  const { directory } = configuration.repository;
  const agent_directory = toAbsoluteUrl("../../../", import.meta.url);
  const { name, version, homepage } = parseJSON(
    readFileSync(new URL("package.json", agent_directory), "utf8"),
  );
  return extendConfiguration(
    configuration,
    {
      agent: {
        directory: agent_directory,
        package: { name, version, homepage },
      },
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
        recorder: (
          configuration.command.tokens === null
            ? mocha_regexp_array.some((regexp) =>
                regexp.test(configuration.command.source),
              )
            : mocha_prefix_array.some((prefix) =>
                isPrefixArray(prefix, configuration.command.tokens),
              )
        )
          ? "mocha"
          : "process",
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
  return {
    ...configuration,
    engine: `node@${version.substring(1)}`,
    main: convertPathToFileUrl(toAbsolutePath(main, toDirectoryPath(cwd()))),
  };
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

export const isConfigurationEnabled = ({
  processes,
  main,
  "default-process": default_process,
}) => main === null || getSpecifierValue(processes, main, default_process);

export const getConfigurationPackage = (
  { packages, "default-package": default_package },
  url,
) => getSpecifierValue(packages, url, default_package);

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

// NODE_OPTIONS format is not platform-specific
// It is also not well documented but it seems to only require whitespace escaping.
// - https://github.com/nodejs/node/issues/12971
// - https://github.com/nodejs/node/commit/2eb627301c1f6681ec51f43b84e37f3908514853
// - https://nodejs.org/api/cli.html#node_optionsoptions
// - https://github.com/nodejs/node/blob/80270994d6ba6019a6a74adc1b97a0cc1bd343ed/src/node_options.cc
const escapeNodeOption = (token) => {
  assert(!token.includes(" "), "spaces should have been percent-encoded");
  return token;
};

const generateNodeHooker = (recorder) => ({
  cli: {
    hookCommandSource: (source, escape, base) => {
      const groups = parseNodeCommand(source);
      return [
        `${groups.before} --experimental-loader=${escape(
          convertFileUrlToPath(
            toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
          ),
        )}${groups.after}`,
      ];
    },
    hookCommandTokens: (tokens, _escape, base) => {
      const { before, after } = splitNodeCommand(tokens);
      return [
        ...before,
        "--experimental-loader",
        convertFileUrlToPath(
          toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
        ),
        ...after,
      ];
    },
    hookEnvironment: (env, _base) => env,
  },
  env: {
    hookCommandSource: (source, _escape, _base) => [source],
    hookCommandTokens: (tokens, _escape, _base) => tokens,
    hookEnvironment: (env, base) => ({
      ...env,
      NODE_OPTIONS: `${coalesce(
        env,
        "NODE_OPTIONS",
        "",
      )} --experimental-loader=${escapeNodeOption(
        toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
      )}`,
    }),
  },
});

const mocha_hooker = {
  hookCommandSource: (source, escape, base) => {
    const groups = parseMochaCommand(source);
    return [
      `${groups.before} --require ${escape(
        convertFileUrlToPath(
          toAbsoluteUrl("lib/node/recorder-mocha.mjs", base),
        ),
      )}${groups.after}`,
    ];
  },
  hookCommandTokens: (tokens, _escape, base) => {
    const { before, after } = splitMochaCommand(tokens);
    return [
      ...before,
      "--require",
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-mocha.mjs", base)),
      ...after,
    ];
  },
  hookEnvironment: (env, base) => ({
    ...env,
    NODE_OPTIONS: `${coalesce(
      env,
      "NODE_OPTIONS",
      "",
    )} --experimental-loader=${escapeNodeOption(
      toAbsoluteUrl("lib/node/mocha-loader.mjs", base),
    )}`,
  }),
};

const hookers = {
  process: generateNodeHooker("process"),
  remote: generateNodeHooker("remote"),
  mocha: {
    cli: mocha_hooker,
    env: mocha_hooker,
  },
};

export const compileConfigurationCommand = (configuration, env) => {
  assert(configuration.agent !== null, "missing agent in configuration");
  assert(configuration.command !== null, "missing command in configuration");
  const {
    agent: { directory },
    recorder,
    "recursive-process-recording": recursive,
    command: { source, tokens },
    "command-options": options,
  } = configuration;
  expect(
    tokens !== null || options.shell !== false,
    "A shell must be provided in order to hook unparsed command, please set `command-options.shell` to `true` or provide a parsed command as an array of tokens",
  );
  env = {
    ...env,
    ...options.env,
    APPMAP_CONFIGURATION: stringifyJSON(configuration),
  };
  const { hookCommandSource, hookCommandTokens, hookEnvironment } =
    hookers[recorder][recursive ? "env" : "cli"];
  const escape = generateEscape(options.shell, env);
  const [exec, ...argv] =
    tokens === null
      ? hookCommandSource(source, escape, directory)
      : hookCommandTokens(tokens, escape, directory);
  return {
    exec,
    argv,
    options: {
      ...options,
      env: hookEnvironment(env, directory),
    },
  };
};
