import { platform as getPlatform } from "node:os";
import {
  assertDeepEqual,
  assertEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  resolveConfigurationRepository,
  resolveConfigurationAutomatedRecorder,
  resolveConfigurationManualRecorder,
  extendConfigurationNode,
  extendConfigurationPort,
  isConfigurationEnabled,
  getConfigurationPackage,
  getConfigurationScenarios,
  compileConfigurationCommand,
} from "./index.mjs";

const {
  URL,
  Reflect: { get },
} = globalThis;

////////////////////////////////////////
// resolveConfigurationManualRecorder //
////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationManualRecorder(
      createConfiguration("protocol://host/home/"),
    ),
    "recorder",
  ),
  "manual",
);

///////////////////////////////
// getConfigurationScenarios //
///////////////////////////////

assertDeepEqual(
  getConfigurationScenarios(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        scenario: "^f",
        scenarios: { foo: { name: "foo" }, bar: { name: "bar" } },
      },
      "protocol://host/base/",
    ),
  ),
  [
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      { scenario: "^f", name: "foo" },
      null,
    ),
  ],
);

assertThrow(
  () =>
    getConfigurationScenarios(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          scenario: ")(",
          scenarios: {},
        },
        "protocol://host/base/",
      ),
    ),
  /^ExternalAppmapError: Scenario is not a regexp$/u,
);

////////////////////////////////////
// resolveConfigurationRepository //
////////////////////////////////////

resolveConfigurationRepository(createConfiguration("protocol://host/home/"));

/////////////////////////////
// extendConfigurationPort //
/////////////////////////////

assertEqual(
  get(
    extendConfigurationPort(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          "trace-port": "",
          "track-port": 8000,
        },
        "protocol://host/base/",
      ),
      {
        "trace-port": "ipc",
        "track-port": 8000,
      },
    ),
    "trace-port",
  ),
  "protocol://host/home/ipc",
);

///////////////////////////////////////////
// resolveConfigurationAutomatedRecorder //
///////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          command: ["mocha"],
        },
        "protocol://host/base/",
      ),
    ),
    "recorder",
  ),
  "mocha",
);

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          command: ["npx", "mocha"],
        },
        "protocol://host/base/",
      ),
    ),
    "recorder",
  ),
  "mocha",
);

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          command: ["npm", "exec", "mocha"],
        },
        "protocol://host/base/",
      ),
    ),
    "recorder",
  ),
  "mocha",
);

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          command: "node main.js",
        },
        "protocol://host/base/",
      ),
    ),
    "recorder",
  ),
  "process",
);

////////////////////////////
// isConfigurationEnabled //
////////////////////////////

{
  const configuration = createConfiguration("protocol://host/home/");
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        { main: "main.js" },
        "protocol://host/base/",
      ),
    ),
    true,
  );
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        {
          processes: {
            glob: "*",
            enabled: false,
          },
          main: "main.js",
        },
        "protocol://host/base/",
      ),
    ),
    false,
  );
}

/////////////////////////////
// getConfigurationPackage //
/////////////////////////////

assertDeepEqual(
  getConfigurationPackage(
    createConfiguration("protocol://host/home/"),
    "protocol://host/home/main.js",
  ),
  {
    enabled: false,
    shallow: false,
    exclude: [],
    "inline-source": null,
  },
);

assertDeepEqual(
  getConfigurationPackage(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        packages: [
          { glob: "*", exclude: ["exclude1"] },
          { glob: "**/*", exclude: ["exclude2"] },
        ],
      },
      "protocol://host/base/",
    ),
    "protocol://host/base/foo/bar",
  ),
  {
    enabled: true,
    shallow: false,
    exclude: [
      {
        "every-label": true,
        "qualified-name": "exclude2",
        "some-label": true,
        combinator: "and",
        excluded: true,
        name: true,
        recursive: true,
      },
    ],
    "inline-source": null,
  },
);

/////////////////////////////
// extendConfigurationNode //
/////////////////////////////

assertEqual(
  get(
    extendConfigurationNode(createConfiguration("protocol://host/home/"), {
      version: "v1.2.3",
      argv: ["node", "main.js"],
      cwd: () => convertFileUrlToPath("file:///w:/cwd"),
    }),
    "main",
  ),
  "file:///w:/cwd/main.js",
);

/////////////////////////////////
// compilConfigurationeCommand //
/////////////////////////////////

const stripEnvironmentConfiguration = ({
  exec,
  argv,
  options: {
    cwd,
    env: { APPMAP_CONFIGURATION: _, ...env },
  },
}) => ({ exec, argv, cwd, env });

const testCompileCommand = ({
  base = "protocol://host/base/",
  directory = "agent",
  recursive = true,
  command = "command",
  recorder = "process",
  exec = "exec",
  argv = ["argv"],
  shell = false,
  options = null,
}) => {
  assertDeepEqual(
    stripEnvironmentConfiguration(
      compileConfigurationCommand(
        extendConfiguration(
          createConfiguration("protocol://host/home/"),
          {
            agent: {
              directory,
              package: {
                name: "@appmap-agent-js",
                version: "1.2.3",
                homepage: null,
              },
            },
            "recursive-process-recording": recursive,
            command,
            recorder,
            "command-options": {
              shell,
              env: {
                VAR1: "VAL1",
                NODE_OPTIONS: "--node-key=node-value",
              },
            },
          },
          base,
        ),
        {
          VAR2: "VAL2",
        },
      ),
    ),
    {
      exec,
      argv,
      cwd: new URL(base).href,
      env: {
        NODE_OPTIONS:
          options === null
            ? "--node-key=node-value"
            : `${"--node-key=node-value"} ${options}`,
        VAR1: "VAL1",
        VAR2: "VAL2",
      },
    },
  );
};

// node //

// node >> env >> tokens //
testCompileCommand({
  recursive: true,
  recorder: "process",
  directory: "agent",
  command: ["node", "main.js", "argv1"],
  exec: "node",
  argv: ["main.js", "argv1"],
  base: "protocol://host/base/",
  options:
    "--experimental-loader=protocol://host/base/agent/lib/node/recorder-process.mjs",
});

// node >> env >> source //
testCompileCommand({
  recursive: true,
  recorder: "process",
  directory: "agent",
  command: "node main.js argv1",
  shell: "shell",
  exec: "node main.js argv1",
  argv: [],
  base: "protocol://host/base/",
  options:
    "--experimental-loader=protocol://host/base/agent/lib/node/recorder-process.mjs",
});

// node >> cli >> tokens //
testCompileCommand({
  recursive: false,
  recorder: "process",
  directory: "agent",
  command: ["node", "main.js", "argv1"],
  exec: "node",
  argv: [
    "--experimental-loader",
    convertFileUrlToPath("file:///w:/base/agent/lib/node/recorder-process.mjs"),
    "main.js",
    "argv1",
  ],
  base: "file:///w:/base/",
});

// node >> cli >> source >> posix //
testCompileCommand({
  recursive: false,
  recorder: "process",
  directory: "agent",
  command: "node main.js argv1",
  shell: "/bin/sh",
  exec: `node --experimental-loader=${
    // explicit platform specific because of shell escape
    getPlatform() === "win32"
      ? "w:\\\\base\\\\agent\\\\lib\\\\node\\\\recorder-process.mjs"
      : "/w:/base/agent/lib/node/recorder-process.mjs"
  } main.js argv1`,
  argv: [],
  base: "file:///w:/base/",
});

// node >> cli >> source >> win32 //
// Enable in posix for coverage
testCompileCommand({
  recursive: false,
  recorder: "process",
  directory: "agent",
  command: "node main.js argv1",
  shell: "cmd.exe",
  exec: `node --experimental-loader=${
    // explicit platform specific because of shell escape
    getPlatform() === "win32"
      ? "w:\\base\\agent\\lib\\node\\recorder-process.mjs"
      : "/w:/base/agent/lib/node/recorder-process.mjs"
  } main.js argv1`,
  argv: [],
  base: "file:///w:/base/",
});

// mocha //

// mocha >> tokens //
testCompileCommand({
  recursive: true,
  recorder: "mocha",
  directory: "agent",
  command: ["npx", "mocha", "argv1"],
  exec: "npx",
  argv: [
    "mocha",
    "--require",
    convertFileUrlToPath("file:///w:/base/agent/lib/node/recorder-mocha.mjs"),
    "argv1",
  ],
  base: "file:///w:/base/",
  options:
    "--experimental-loader=file:///w:/base/agent/lib/node/loader-standalone.mjs",
});

// mocha >> source && resolve shell //
testCompileCommand({
  recursive: true,
  recorder: "mocha",
  directory: "agent",
  command: "npx mocha argv1",
  shell: true,
  exec: `npx mocha --require ${
    // explicit platform specific because of shell escape
    getPlatform() === "win32"
      ? "w:\\^ base^ \\agent\\lib\\node\\recorder-mocha.mjs"
      : "/w:/\\ base\\ /agent/lib/node/recorder-mocha.mjs"
  } argv1`,
  argv: [],
  base: "file:///w:/ base /",
  options:
    "--experimental-loader=file:///w:/%20base%20/agent/lib/node/loader-standalone.mjs",
});

assertThrow(() => {
  testCompileCommand({
    recorder: "mocha",
    command: "foo bar",
    shell: true,
  });
}, /^ExternalAppmapError: Not a mocha command$/u);

assertThrow(() => {
  testCompileCommand({
    recorder: "mocha",
    command: ["foo", "bar"],
  });
}, /^ExternalAppmapError: Not a parsed mocha command$/u);
