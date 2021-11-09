import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import ConfigurationHelper from "./index.mjs";

const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  throws: assertThrows,
} = Assert;

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const {
  isConfigurationEnabled,
  getConfigurationPackage,
  extendConfigurationJSON,
  extendConfigurationNode,
  compileCommandConfiguration,
} = ConfigurationHelper(await buildTestDependenciesAsync(import.meta.url));

/////////////////////////////
// extendConfigurationJSON //
/////////////////////////////

assertEqual(
  Reflect.get(
    extendConfigurationJSON(
      createConfiguration("/home"),
      JSON.stringify({ log: "error" }),
      null,
    ),
    "log",
  ),
  "error",
);

////////////////////////////
// isConfigurationEnabled //
////////////////////////////

{
  const configuration = createConfiguration("/repository");
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(configuration, { main: "main.js" }, "/repository"),
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
        "/directory",
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
    createConfiguration("/repository").packages,
    "data:,FOO",
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
    createConfiguration("/repository").packages,
    "file:///directory/foo",
  ),
  {
    enabled: false,
    shallow: true,
    exclude: [],
    "inline-source": null,
  },
);
assertDeepEqual(
  getConfigurationPackage(
    extendConfiguration(
      createConfiguration("/repository"),
      {
        packages: "*",
      },
      "/directory",
    ).packages,
    "file:///directory/foo",
  ),
  {
    enabled: true,
    shallow: false,
    exclude: [],
    "inline-source": null,
  },
);

/////////////
// extract //
/////////////

// assertDeepEqual(
//   extractEnvironmentConfiguration({
//     APPMAP_FOO_BAR: "value1",
//     QUX: "value2",
//   }),
//   { "foo-bar": "value1" },
// );

/////////////////////////////////
// compilConfigurationeCommand //
/////////////////////////////////

// scenarios //

// assertDeepEqual(extend("scenarios", { name: ["exec", "argv0"] }, "/base"), {
//   name: [
//     {
//       fork: null,
//       exec: "exec",
//       argv: ["argv0"],
//       configuration: {
//         data: {},
//         directory: "/base",
//       },
//       options: {
//         encoding: "utf8",
//         cwd: "/base",
//         env: {},
//         stdio: "inherit",
//         timeout: 0,
//         killSignal: "SIGTERM",
//       },
//     },
//   ],
// });

const stripEnvironmentConfiguration = ({
  command,
  options: {
    env: { APPMAP_CONFIGURATION, ...env },
  },
}) => ({ command, env });

// recursive-process-recording: true //
assertDeepEqual(
  stripEnvironmentConfiguration(
    compileCommandConfiguration(
      extendConfiguration(
        createConfiguration("/cwd1"),
        {
          agent: {
            directory: "/agent",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          "recursive-process-recording": true,
          command: "exec argv1 $VAR1",
          recorder: "process",
          "command-options": {
            env: { VAR1: "VAL1-1", NODE_OPTIONS: "--node-key=node-value" },
          },
        },
        "/cwd2",
      ),
      {
        VAR1: "VAL1-2",
        VAR2: "VAL2",
      },
    ),
  ),
  {
    command: "exec argv1 $VAR1",
    env: {
      NODE_OPTIONS: [
        "--node-key=node-value",
        "--require=/agent/lib/node/abomination.js",
        "--experimental-loader=/agent/lib/node/recorder-process.mjs",
      ].join(" "),
      VAR1: "VAL1-1",
      VAR2: "VAL2",
    },
  },
);

// recursive-process-recording: false //
assertDeepEqual(
  stripEnvironmentConfiguration(
    compileCommandConfiguration(
      extendConfiguration(
        createConfiguration("/cwd1"),
        {
          agent: {
            directory: "/agent",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          "recursive-process-recording": false,
          command: "node * $VAR1 > $VAR2",
          recorder: "process",
          "command-options": {
            env: { VAR1: "VAL1-1" },
          },
        },
        "/cwd2",
      ),
      {
        VAR1: "VAL1-2",
        VAR2: "VAL2",
      },
    ),
  ),
  {
    command: [
      "'node'",
      "'--experimental-loader'",
      "'/agent/lib/node/recorder-process.mjs'",
      "*",
      "'VAL1-1'",
      ">",
      "'VAL2'",
    ].join(" "),
    env: {
      VAR1: "VAL1-1",
      VAR2: "VAL2",
    },
  },
);

// mocha //
{
  const testMocha = (npx) => {
    assertDeepEqual(
      stripEnvironmentConfiguration(
        compileCommandConfiguration(
          extendConfiguration(
            createConfiguration("/cwd1"),
            {
              agent: {
                directory: "/agent",
                package: {
                  name: "@appmap-agent-js",
                  version: "1.2.3",
                  homepage: null,
                },
              },
              command: [...(npx ? ["npx"] : []), "mocha", "argv1"].join(" "),
              recorder: "mocha",
            },
            "/cwd2",
          ),
          {},
        ),
      ),
      {
        command: [
          ...(npx ? ["'npx'", "'--always-spawn'"] : []),
          "'mocha'",
          "'--require'",
          "'/agent/lib/node/recorder-mocha.mjs'",
          "'argv1'",
        ].join(" "),
        env: {
          NODE_OPTIONS: [
            "",
            "--require=/agent/lib/node/abomination.js",
            "--experimental-loader=/agent/lib/node/mocha-loader.mjs",
          ].join(" "),
        },
      },
    );
  };
  testMocha(true);
  testMocha(false);
  assertThrows(() => {
    compileCommandConfiguration(
      extendConfiguration(
        createConfiguration("/cwd1"),
        {
          agent: {
            directory: "/agent",
            package: {
              name: "@appmap-agent-js",
              version: "1.2.3",
              homepage: null,
            },
          },
          command: "foo",
          recorder: "mocha",
        },
        "/cwd2",
      ),
      {},
    );
  }, /^AppmapError/);
}

/////////////////////////////
// extendConfigurationNode //
/////////////////////////////

extendConfigurationNode(createConfiguration("cwd"), {
  version: "v1.2.3",
  argv: ["node", "main.js"],
  cwd: () => "/cwd",
});
