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
  for (const enabled of [true, false]) {
    assertEqual(
      isConfigurationEnabled(
        extendConfiguration(
          configuration,
          {
            enabled,
            processes: [],
            main: "foo.mjs",
          },
          "/cwd",
        ),
      ),
      enabled,
    );
  }
  for (const enabled of [true, false]) {
    assertEqual(
      isConfigurationEnabled(
        extendConfiguration(
          configuration,
          {
            main: "foo.mjs",
            enabled: "process",
            processes: {
              glob: "*.mjs",
              enabled,
            },
          },
          "/cwd",
        ),
      ),
      enabled,
    );
  }
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        {
          main: "foo.mjs",
          enabled: "process",
          processes: [],
        },
        "/cwd",
      ),
    ),
    false,
  );
}

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
  [
    {
      source: "^(?:\\/foo)$",
      flags: "",
      basedir: "/base",
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

// packages //

assertDeepEqual(extend("packages", "foo", "/base"), [
  [
    {
      source: "^(?:foo)$",
      flags: "",
      basedir: "/base",
    },
    { shallow: false, enabled: true, exclude: [], source: null },
  ],
]);
