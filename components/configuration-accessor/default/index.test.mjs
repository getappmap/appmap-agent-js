import {
  assertDeepEqual,
  assertEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import { platform as getPlatform } from "os";
import ConfigurationAccessor from "./index.mjs";

const {
  Reflect: { get },
  URL,
} = globalThis;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  resolveConfigurationRepository,
  resolveConfigurationAutomatedRecorder,
  resolveConfigurationManualRecorder,
  extendConfigurationNode,
  extendConfigurationPort,
  isConfigurationEnabled,
  getConfigurationPackage,
  getConfigurationScenarios,
  compileConfigurationCommand,
} = ConfigurationAccessor(await buildTestDependenciesAsync(import.meta.url));

////////////////////////////////////////
// resolveConfigurationManualRecorder //
////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationManualRecorder(createConfiguration("file:///home")),
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
      createConfiguration("file:///home"),
      {
        scenario: "^f",
        scenarios: { foo: { name: "foo" }, bar: { name: "bar" } },
      },
      "file:///base",
    ),
  ),
  [
    extendConfiguration(
      createConfiguration("file:///home"),
      { scenario: "^f", name: "foo" },
      null,
    ),
  ],
);

////////////////////////////////////
// resolveConfigurationRepository //
////////////////////////////////////

resolveConfigurationRepository(createConfiguration("file:///home"));

/////////////////////////////
// extendConfigurationPort //
/////////////////////////////

assertEqual(
  get(
    extendConfigurationPort(
      extendConfiguration(
        createConfiguration("file:///home"),
        {
          "trace-port": "",
          "track-port": 8000,
        },
        "file:///base",
      ),
      {
        "trace-port": "ipc",
        "track-port": 8000,
      },
    ),
    "trace-port",
  ),
  "file:///home/ipc",
);

///////////////////////////////////////////
// resolveConfigurationAutomatedRecorder //
///////////////////////////////////////////

assertEqual(
  get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("file:///home"),
        {
          command: ["mocha"],
        },
        "file:///base",
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
        createConfiguration("file:///home"),
        {
          command: ["npx", "mocha"],
        },
        "file:///base",
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
        createConfiguration("file:///home"),
        {
          command: ["npm", "exec", "mocha"],
        },
        "file:///base",
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
        createConfiguration("file:///home"),
        {
          command: "node main.js",
        },
        "file:///base",
      ),
    ),
    "recorder",
  ),
  "remote",
);

////////////////////////////
// isConfigurationEnabled //
////////////////////////////

{
  const configuration = createConfiguration("file:///home");
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(configuration, { main: "main.js" }, "file:///base"),
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
        "file:///base",
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
    createConfiguration("file:///home"),
    "http://host/file.txt",
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
    createConfiguration("file:///home"),
    "file:///directory/foo",
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
      createConfiguration("file:///home"),
      {
        packages: [
          { glob: "*", exclude: ["exclude1"] },
          { glob: "**/*", exclude: ["exclude2"] },
        ],
      },
      "file:///base",
    ),
    "file:///base/foo/bar",
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
    extendConfigurationNode(createConfiguration("file:///home"), {
      version: "v1.2.3",
      argv: ["node", "main.js"],
      cwd: () => "cwd",
    }),
    "main",
  ),
  "file:///home/cwd/main.js",
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

// recursive-process-recording: true //
assertDeepEqual(
  stripEnvironmentConfiguration(
    compileConfigurationCommand(
      extendConfiguration(
        createConfiguration("file:///home"),
        {
          agent: {
            directory: "file:///agent",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          "recursive-process-recording": true,
          command: "command",
          recorder: "process",
          "command-options": {
            env: { VAR1: "VAL1", NODE_OPTIONS: "--node-key=node-value" },
          },
        },
        "file:///base",
      ),
      {
        VAR2: "VAL2",
      },
    ),
  ),
  {
    exec: getPlatform() === "win32" ? "cmd.exe" : "/bin/sh",
    argv: getPlatform() === "win32" ? ["/c", "command"] : ["-c", "command"],
    cwd: new URL("file:///base"),
    env: {
      NODE_OPTIONS: [
        "--node-key=node-value",
        "--require=../agent/lib/node/abomination.js",
        "--experimental-loader=../agent/lib/node/recorder-process.mjs",
      ].join(" "),
      VAR1: "VAL1",
      VAR2: "VAL2",
    },
  },
);

// recursive-process-recording: false //
assertDeepEqual(
  stripEnvironmentConfiguration(
    compileConfigurationCommand(
      extendConfiguration(
        createConfiguration("file:///home"),
        {
          agent: {
            directory: "file:///agent",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          "recursive-process-recording": false,
          command: ["node", "main.js", "argv1"],
          "command-options": {
            shell: ["/bin/sh", "-c"],
          },
          recorder: "process",
        },
        "file:///base",
      ),
      {},
    ),
  ),
  {
    exec: "/bin/sh",
    argv: [
      "-c",
      "node --experimental-loader ../agent/lib/node/recorder-process.mjs main.js argv1",
    ],
    cwd: new URL("file:///base"),
    env: {},
  },
);

// mocha //
{
  const testMocha = (command) => {
    assertDeepEqual(
      stripEnvironmentConfiguration(
        compileConfigurationCommand(
          extendConfiguration(
            createConfiguration("file:///home"),
            {
              agent: {
                directory: "file:///agent",
                package: {
                  name: "@appmap-agent-js",
                  version: "1.2.3",
                  homepage: null,
                },
              },
              command,
              "command-options": {
                shell: ["/bin/sh", "-c"],
              },
              recorder: "mocha",
            },
            "file:///base",
          ),
          {},
        ),
      ),
      {
        exec: "/bin/sh",
        argv: [
          "-c",
          `${command} --require ../agent/lib/node/recorder-mocha.mjs`,
        ],
        cwd: new URL("file:///base"),
        env: {
          NODE_OPTIONS: [
            "",
            "--require=../agent/lib/node/abomination.js",
            "--experimental-loader=../agent/lib/node/mocha-loader.mjs",
          ].join(" "),
        },
      },
    );
  };
  testMocha("mocha");
  testMocha("npx mocha");
  testMocha("npm exec mocha");
  assertThrow(() => testMocha("foo"), /^AppmapError/);
}
