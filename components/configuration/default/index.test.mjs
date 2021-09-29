/* eslint-env node */

import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Configuration from "./index.mjs";

const { cwd } = process;
const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const {
  createConfiguration,
  extendConfiguration,
  // extractEnvironmentConfiguration,
  getConfigurationPackage,
  isConfigurationEnabled,
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
      extendConfiguration(configuration, { main: "main.js" }, "/directory"),
    ),
    false,
  );
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        {
          processes: "*",
          main: "main.js",
        },
        "/directory",
      ),
    ),
    true,
  );
}

// getConfigurationPackage //
assertDeepEqual(
  getConfigurationPackage(
    createConfiguration("/repository").packages,
    "/directory/foo",
  ),
  {
    enabled: false,
    shallow: true,
    exclude: [],
    source: null,
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
    "/directory/foo",
  ),
  {
    enabled: true,
    shallow: false,
    exclude: [],
    source: null,
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

// scenarios //

assertDeepEqual(extend("scenarios", { name: ["exec", "argv0"] }, "/base"), {
  name: [
    {
      fork: null,
      exec: "exec",
      argv: ["argv0"],
      configuration: {
        data: {},
        directory: "/base",
      },
      options: {
        encoding: "utf8",
        cwd: "/base",
        env: {},
        stdio: "inherit",
        timeout: 0,
        killSignal: "SIGTERM",
      },
    },
  ],
});

// output //

assertDeepEqual(extend("output", "directory", "/base"), {
  target: "file-system",
  directory: "/base/directory",
  basename: null,
  extension: ".appmap.json",
});

assertDeepEqual(extend("output", null, "/base"), {
  target: "http",
  directory: `${cwd()}/tmp/appmap`,
  basename: null,
  extension: ".appmap.json",
});

// processes //

assertDeepEqual(extend("processes", "/foo", "/base"), [
  [{ basedir: "/base", source: "^(?:\\/foo)$", flags: "" }, true],
  [
    {
      basedir: "/Users/soft/Desktop/workspace/appmap-agent-js",
      source: "(^\\.\\.)|((^|/)node_modules/)",
      flags: "u",
    },
    false,
  ],
  [
    {
      basedir: "/Users/soft/Desktop/workspace/appmap-agent-js",
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
