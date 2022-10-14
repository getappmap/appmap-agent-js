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
  "remote",
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
    createConfiguration("file:///w:/home/"),
    "file:///w:/directory/foo",
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

// recursive-process-recording: true //
assertDeepEqual(
  stripEnvironmentConfiguration(
    compileConfigurationCommand(
      extendConfiguration(
        createConfiguration("file:///w:/home/"),
        {
          agent: {
            directory: "agent",
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
        "file:///w:/base/",
      ),
      {
        VAR2: "VAL2",
      },
    ),
  ),
  {
    exec: getPlatform() === "win32" ? "cmd.exe" : "/bin/sh",
    argv: getPlatform() === "win32" ? ["/c", "command"] : ["-c", "command"],
    cwd: "file:///w:/base/",
    env: {
      NODE_OPTIONS: [
        "--node-key=node-value",
        `--experimental-loader=${convertFileUrlToPath(
          "file:///w:/base/agent/lib/node/recorder-process.mjs",
        )}`,
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
        createConfiguration("file:///w:/home/"),
        {
          agent: {
            directory: "agent",
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
        "file:///w:/base/",
      ),
      {},
    ),
  ),
  {
    exec: "/bin/sh",
    argv: [
      "-c",
      `node --experimental-loader ${convertFileUrlToPath(
        "file:///w:/base/agent/lib/node/recorder-process.mjs",
      )} main.js argv1`,
    ],
    cwd: "file:///w:/base/",
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
            createConfiguration("file:///w:/home/"),
            {
              agent: {
                directory: "agent",
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
            "file:///w:/base/",
          ),
          {},
        ),
      ),
      {
        exec: "/bin/sh",
        argv: [
          "-c",
          `${command} --require ${convertFileUrlToPath(
            "file:///w:/base/agent/lib/node/recorder-mocha.mjs",
          )}`,
        ],
        cwd: "file:///w:/base/",
        env: {
          NODE_OPTIONS: [
            "",
            `--experimental-loader=${convertFileUrlToPath(
              "file:///w:/base/agent/lib/node/mocha-loader.mjs",
            )}`,
          ].join(" "),
        },
      },
    );
  };
  testMocha("mocha");
  testMocha("npx mocha");
  testMocha("npm exec mocha");
  assertThrow(() => testMocha("foo"), /^AppmapError/u);
}
