import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import ConfigurationAccessor from "./index.mjs";

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
  // compileConfigurationCommand,
} = ConfigurationAccessor(await buildTestDependenciesAsync(import.meta.url));

////////////////////////////////////////
// resolveConfigurationManualRecorder //
////////////////////////////////////////

assertEqual(
  Reflect.get(
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
  Reflect.get(
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
  Reflect.get(
    resolveConfigurationAutomatedRecorder(
      extendConfiguration(
        createConfiguration("file:///home"),
        {
          command: "npx mocha",
        },
        "file:///base",
      ),
    ),
    "recorder",
  ),
  "mocha",
);

assertEqual(
  Reflect.get(
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
  Reflect.get(
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

// const stripEnvironmentConfiguration = ({
//   command,
//   options: {
//     env: { APPMAP_CONFIGURATION, ...env },
//   },
// }) => ({ command, env });
//
// // recursive-process-recording: true //
// assertDeepEqual(
//   stripEnvironmentConfiguration(
//     compileConfigurationCommand(
//       extendConfiguration(
//         createConfiguration("file:///home"),
//         {
//           agent: {
//             directory: "file:///agent",
//             package: {
//               name: "@appmap-agent-js",
//               version: "1.2.3",
//               homepage: null,
//             },
//           },
//           "recursive-process-recording": true,
//           command: "exec argv1 $VAR1",
//           recorder: "process",
//           "command-options": {
//             env: { VAR1: "VAL1-1", NODE_OPTIONS: "--node-key=node-value" },
//           },
//         },
//         "file:///base",
//       ),
//       {
//         VAR1: "VAL1-2",
//         VAR2: "VAL2",
//       },
//     ),
//   ),
//   {
//     command: "exec argv1 $VAR1",
//     env: {
//       NODE_OPTIONS: [
//         "--node-key=node-value",
//         "--require=/agent/lib/node/abomination.js",
//         "--experimental-loader=/agent/lib/node/recorder-process.mjs",
//       ].join(" "),
//       VAR1: "VAL1-1",
//       VAR2: "VAL2",
//     },
//   },
// );
//
// // recursive-process-recording: false //
// assertDeepEqual(
//   stripEnvironmentConfiguration(
//     compileConfigurationCommand(
//       extendConfiguration(
//         createConfiguration("file:///home"),
//         {
//           agent: {
//             directory: "file:///agent",
//             package: {
//               name: "@appmap-agent-js",
//               version: "1.2.3",
//               homepage: null,
//             },
//           },
//           "recursive-process-recording": false,
//           command: "node * $VAR1 > $VAR2",
//           recorder: "process",
//           "command-options": {
//             env: { VAR1: "VAL1-1" },
//           },
//         },
//         "file:///base",
//       ),
//       {
//         VAR1: "VAL1-2",
//         VAR2: "VAL2",
//       },
//     ),
//   ),
//   {
//     command: [
//       "'node'",
//       "'--experimental-loader'",
//       "'/agent/lib/node/recorder-process.mjs'",
//       "*",
//       "'VAL1-1'",
//       ">",
//       "'VAL2'",
//     ].join(" "),
//     env: {
//       VAR1: "VAL1-1",
//       VAR2: "VAL2",
//     },
//   },
// );
//
// // mocha //
// {
//   const testMocha = (npx) => {
//     assertDeepEqual(
//       stripEnvironmentConfiguration(
//         compileConfigurationCommand(
//           extendConfiguration(
//             createConfiguration("file:///home"),
//             {
//               agent: {
//                 directory: "file:///agent",
//                 package: {
//                   name: "@appmap-agent-js",
//                   version: "1.2.3",
//                   homepage: null,
//                 },
//               },
//               command: [...(npx ? ["npx"] : []), "mocha", "argv1"].join(" "),
//               recorder: "mocha",
//             },
//             "file:///base",
//           ),
//           {},
//         ),
//       ),
//       {
//         command: [
//           ...(npx ? ["'npx'", "'--always-spawn'"] : []),
//           "'mocha'",
//           "'--require'",
//           "'/agent/lib/node/recorder-mocha.mjs'",
//           "'argv1'",
//         ].join(" "),
//         env: {
//           NODE_OPTIONS: [
//             "",
//             "--require=/agent/lib/node/abomination.js",
//             "--experimental-loader=/agent/lib/node/mocha-loader.mjs",
//           ].join(" "),
//         },
//       },
//     );
//   };
//   testMocha(true);
//   testMocha(false);
//   assertThrow(() => {
//     compileConfigurationCommand(
//       extendConfiguration(
//         createConfiguration("file:///home"),
//         {
//           agent: {
//             directory: "file:///agent",
//             package: {
//               name: "@appmap-agent-js",
//               version: "1.2.3",
//               homepage: null,
//             },
//           },
//           command: "foo",
//           recorder: "mocha",
//         },
//         "file:///base",
//       ),
//       {},
//     );
//   }, /^AppmapError/);
// }
