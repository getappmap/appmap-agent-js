import { platform as getPlatform } from "node:os";
import {
  assertDeepEqual,
  assertEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
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
} from "./index.mjs?env=test";

const {
  Reflect: { get },
} = globalThis;

////////////////////////////////////////
// resolveConfigurationManualRecorder //
////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationManualRecorder(createConfiguration("file:///w:/home/")),
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
      createConfiguration("file:///w:/home/"),
      {
        scenario: "^f",
        scenarios: { foo: { name: "foo" }, bar: { name: "bar" } },
      },
      "file:///w:/base/",
    ),
  ),
  [
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      { scenario: "^f", name: "foo" },
      null,
    ),
  ],
);

////////////////////////////////////
// resolveConfigurationRepository //
////////////////////////////////////

resolveConfigurationRepository(createConfiguration("file:///w:/home/"));

/////////////////////////////
// extendConfigurationPort //
/////////////////////////////

assertEqual(
  get(
    extendConfigurationPort(
      extendConfiguration(
        createConfiguration("file:///w:/home/"),
        {
          "trace-port": "",
          "track-port": 8000,
        },
        "file:///w:/base/",
      ),
      {
        "trace-port": "ipc",
        "track-port": 8000,
      },
    ),
    "trace-port",
  ),
  "file:///w:/home/ipc",
);

///////////////////////////////////////////
// resolveConfigurationAutomatedRecorder //
///////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("file:///w:/home/"),
        {
          command: ["mocha"],
        },
        "file:///w:/base/",
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
        createConfiguration("file:///w:/home/"),
        {
          command: ["npx", "mocha"],
        },
        "file:///w:/base/",
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
        createConfiguration("file:///w:/home/"),
        {
          command: ["npm", "exec", "mocha"],
        },
        "file:///w:/base/",
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
        createConfiguration("file:///w:/home/"),
        {
          command: "node main.js",
        },
        "file:///w:/base/",
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
  const configuration = createConfiguration("file:///w:/home/");
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        { main: "main.js" },
        "file:///w:/base/",
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
        "file:///w:/base/",
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
    createConfiguration("file:///w:/home/"),
    "file:///w:/home/node_modules/dep.js",
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
    createConfiguration("file:///w:/home1/"),
    "file:///w:/home2/main.js",
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
    createConfiguration("file:///w:/home/"),
    "file:///w:/home/main.js",
  ),
  {
    enabled: true,
    shallow: false,
    exclude: [],
    "inline-source": null,
  },
);

assertDeepEqual(
  getConfigurationPackage(
    extendConfiguration(
      createConfiguration("file:///w:/home/"),
      {
        packages: [
          { glob: "*", exclude: ["exclude1"] },
          { glob: "**/*", exclude: ["exclude2"] },
        ],
      },
      "file:///w:/base/",
    ),
    "file:///w:/base/foo/bar",
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
    extendConfigurationNode(createConfiguration("file:///w:/home/"), {
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
  base = "file:///w:/base/",
  directory = "agent",
  recursive = true,
  command = "command",
  recorder = "process",
  exec = "exec",
  argv = ["argv"],
  shell = null,
  options = null,
}) => {
  assertDeepEqual(
    stripEnvironmentConfiguration(
      compileConfigurationCommand(
        extendConfiguration(
          createConfiguration("file:///w:/home/"),
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
      cwd: base,
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
  base: "file:///w:/base/",
  options: `--experimental-loader=${convertFileUrlToPath(
    "file:///w:/base/agent/lib/node/recorder-process.mjs",
  )}`,
});

// node >> env >> source //
testCompileCommand({
  recursive: true,
  recorder: "process",
  directory: "agent",
  command: "node main.js argv1",
  shell: ["exec", "flag"],
  exec: "exec",
  argv: ["flag", "node main.js argv1"],
  base: "file:///w:/base/",
  options: `--experimental-loader=${convertFileUrlToPath(
    "file:///w:/base/agent/lib/node/recorder-process.mjs",
  )}`,
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
  shell: ["/bin/sh", "-c"],
  exec: "/bin/sh",
  argv: [
    "-c",
    `node --experimental-loader=${
      // explicit platform specific because of shell escape
      getPlatform() === "win32"
        ? "w:\\\\base\\\\agent\\\\lib\\\\node\\\\recorder-process.mjs"
        : "/w:/base/agent/lib/node/recorder-process.mjs"
    } main.js argv1`,
  ],
  base: "file:///w:/base/",
});

// node >> cli >> source >> win32 //
// Enable in posix for coverage
testCompileCommand({
  recursive: false,
  recorder: "process",
  directory: "agent",
  command: "node main.js argv1",
  shell: ["cmd.exe", "/c"],
  exec: "cmd.exe",
  argv: [
    "/c",
    `node --experimental-loader=${
      // explicit platform specific because of shell escape
      getPlatform() === "win32"
        ? "w:\\base\\agent\\lib\\node\\recorder-process.mjs"
        : "/w:/base/agent/lib/node/recorder-process.mjs"
    } main.js argv1`,
  ],
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
  options: `--experimental-loader=${convertFileUrlToPath(
    "file:///w:/base/agent/lib/node/mocha-loader.mjs",
  )}`,
});

// mocha >> source && resolve shell && spaces //
testCompileCommand({
  recursive: true,
  recorder: "mocha",
  directory: "agent",
  command: "npx mocha argv1",
  exec: getPlatform() === "win32" ? "cmd.exe" : "/bin/sh",
  argv: [
    getPlatform() === "win32" ? "/c" : "-c",
    `npx mocha --require ${
      // explicit platform specific because of shell escape
      getPlatform() === "win32"
        ? "w:\\^ base^ \\agent\\lib\\node\\recorder-mocha.mjs"
        : "/w:/\\ base\\ /agent/lib/node/recorder-mocha.mjs"
    } argv1`,
  ],
  base: "file:///w:/%20base%20/",
  options: `--experimental-loader="${convertFileUrlToPath(
    "file:///w:/%20base%20/agent/lib/node/mocha-loader.mjs",
  )}"`,
});

assertThrow(() => {
  testCompileCommand({
    recursive: true,
    recorder: "mocha",
    command: "foo bar",
  });
}, /^AppmapError: Could not parse /u);

assertThrow(() => {
  testCompileCommand({
    recursive: true,
    recorder: "mocha",
    command: ["foo", "bar"],
  });
}, /^AppmapError: Could not recognize /u);
