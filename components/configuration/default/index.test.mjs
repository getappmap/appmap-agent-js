/* eslint-env node */

import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Configuration from "./index.mjs";

const { cwd } = process;
const {
  deepEqual: assertDeepEqual,
  equal: assertEqual,
  throws: assertThrows,
} = Assert;

const {
  createConfiguration,
  extendConfiguration,
  // extractEnvironmentConfiguration,
  getConfigurationPackage,
  isConfigurationEnabled,
  compileCommandConfiguration,
} = Configuration(await buildTestDependenciesAsync(import.meta.url));

const { validateConfiguration } = await buildTestComponentAsync("validate");

const configuration = createConfiguration(cwd());

validateConfiguration(configuration);

const extend = (name, value1, nullable_directory) => {
  const extended_configuration = extendConfiguration(
    configuration,
    { [name]: value1 },
    nullable_directory,
  );
  validateConfiguration(extended_configuration);
  const { [name]: value2 } = extended_configuration;
  return value2;
};

// isConfigurationEnabled //
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

// getConfigurationPackage //
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

// extract //

// assertDeepEqual(
//   extractEnvironmentConfiguration({
//     APPMAP_FOO_BAR: "value1",
//     QUX: "value2",
//   }),
//   { "foo-bar": "value1" },
// );

// main //

assertDeepEqual(extend("main", "foo.js", "/base"), "/base/foo.js");

// port //

assertDeepEqual(
  extend("trace-port", "unix-domain-socket", "/base"),
  "/base/unix-domain-socket",
);

// language //

assertDeepEqual(extend("language", "foo@bar", null), {
  name: "foo",
  version: "bar",
});

assertDeepEqual(extend("language", { name: "foo", version: "bar" }, null), {
  name: "foo",
  version: "bar",
});

// recording //

assertDeepEqual(extend("recording", "foo.bar", null), {
  "defined-class": "foo",
  "method-id": "bar",
});

// frameworks //

assertDeepEqual(extend("frameworks", ["foo@bar"], null), [
  {
    name: "foo",
    version: "bar",
  },
]);

// output //

assertDeepEqual(extend("output", "directory", "/base"), {
  directory: "/base/directory",
  basename: null,
  extension: ".appmap.json",
});

// processes //

assertDeepEqual(extend("processes", true, "/base"), [
  [{ basedir: "/base", source: "^", flags: "u" }, true],
  [
    {
      basedir: cwd(),
      source: "^",
      flags: "u",
    },
    true,
  ],
]);

assertDeepEqual(extend("processes", "/foo", "/base"), [
  [{ basedir: "/base", source: "^(?:\\/foo)$", flags: "" }, true],
  [
    {
      basedir: cwd(),
      source: "^",
      flags: "u",
    },
    true,
  ],
]);

// serialization //

assertDeepEqual(extend("serialization", "toString", null), {
  method: "toString",
  "maximum-length": 96,
  "include-constructor-name": true,
});

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

const getAgentDirectory = (cwd) =>
  `${cwd}/node_modules/@appland/appmap-agent-js`;

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
        `--require=${getAgentDirectory("/cwd1")}/lib/abomination.js`,
        `--experimental-loader=${getAgentDirectory(
          "/cwd1",
        )}/lib/recorder-process.mjs`,
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
      `'${getAgentDirectory("/cwd1")}/lib/recorder-process.mjs'`,
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
          `'${getAgentDirectory("/cwd1")}/lib/recorder-mocha.mjs'`,
          "'argv1'",
        ].join(" "),
        env: {
          NODE_OPTIONS: [
            "",
            `--require=${getAgentDirectory("/cwd1")}/lib/abomination.js`,
            `--experimental-loader=${getAgentDirectory(
              "/cwd1",
            )}/lib/loader.mjs`,
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
          command: "foo",
          recorder: "mocha",
        },
        "/cwd2",
      ),
      {},
    );
  }, /^AppmapError/);
}
