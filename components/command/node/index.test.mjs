import { platform } from "node:process";
import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  pickPlatformSpecificCommand,
  resolveConfigurationAutomatedRecorder,
  compileConfigurationCommandAsync,
} from "./index.mjs";

const {
  Reflect: { get },
} = globalThis;

/////////////////////////////////
// pickPlatformSpecificCommand //
/////////////////////////////////

assertEqual(
  get(
    pickPlatformSpecificCommand(createConfiguration("protocol://host/home/")),
    "command",
  ),
  null,
);

get(
  pickPlatformSpecificCommand({
    ...createConfiguration("protocol://host/home/"),
    [`command-${platform}`]: { source: "foo", tokens: [] },
  }),
  "command",
  { source: "foo", tokens: [] },
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
      {},
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
      {},
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
      {},
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
      {},
    ),
    "recorder",
  ),
  "process",
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

// process >> source >> not-recursive //
assertDeepEqual(
  stripEnvironmentConfiguration(
    await compileConfigurationCommandAsync(
      extendConfiguration(
        createConfiguration("protocol://host/home/"),
        {
          agent: {
            directory: "file:///A:/home/",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          "recursive-process-recording": false,
          command: ["node", "main.mjs"],
          recorder: "process",
          "command-options": {
            shell: false,
            env: {
              VAR1: "VAL1",
            },
          },
        },
        "file:///A:/base/",
      ),
      {
        VAR2: "VAL2",
      },
    ),
  ),
  {
    cwd: "file:///A:/base/",
    exec: "node",
    argv: [
      "--experimental-loader",
      "file:///A:/home/lib/node/recorder.mjs",
      "main.mjs",
    ],
    env: {
      VAR1: "VAL1",
      VAR2: "VAL2",
    },
  },
);

// // remote >> tokens >> recursive //
// assertDeepEqual(
//   stripEnvironmentConfiguration(
//     await compileConfigurationCommandAsync(
//       extendConfiguration(
//         createConfiguration("protocol://host/home/"),
//         {
//           agent: {
//             directory: "file:///A:/home/",
//             package: {
//               name: "@appmap-agent-js",
//               version: "1.2.3",
//               homepage: null,
//             },
//           },
//           "recursive-process-recording": true,
//           command: ["node", "main.mjs"],
//           recorder: "remote",
//           "command-options": {
//             shell: "/bin/sh",
//             env: {
//               VAR1: "VAL1",
//               NODE_OPTIONS: "options",
//             },
//           },
//         },
//         "file:///A:/base/",
//       ),
//       {
//         VAR2: "VAL2",
//       },
//     ),
//   ),
//   {
//     cwd: "file:///A:/base/",
//     exec: "node",
//     argv: ["main.mjs"],
//     env: {
//       VAR1: "VAL1",
//       VAR2: "VAL2",
//       NODE_OPTIONS: `options --experimental-loader=file:///A:/home/lib/node/recorder.mjs`,
//     },
//   },
// );
