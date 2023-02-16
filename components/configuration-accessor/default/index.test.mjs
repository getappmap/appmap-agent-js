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
  resolveConfigurationManualRecorder,
  extendConfigurationNode,
  extendConfigurationPort,
  isConfigurationEnabled,
  getConfigurationPackage,
  getConfigurationScenarios,
} from "./index.mjs";

const {
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
      cwd: () => convertFileUrlToPath("file:///A:/cwd"),
    }),
    "main",
  ),
  "file:///A:/cwd/main.js",
);
