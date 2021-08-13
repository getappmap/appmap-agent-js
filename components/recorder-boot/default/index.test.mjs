import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import RecorderBoot from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const { loadConfiguration, isConfigurationEnabled } = RecorderBoot(
  await buildTestDependenciesAsync(import.meta.url),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

assertDeepEqual(
  extendConfiguration(configuration, { main: "main.mjs" }, "/cwd"),
  loadConfiguration({
    env: {
      APPMAP_CONFIGURATION: JSON.stringify(configuration),
    },
    argv: ["node", "main.mjs"],
    cwd: () => "/cwd",
  }),
);

for (const enabled of [true, false]) {
  assertEqual(
    isConfigurationEnabled(
      extendConfiguration(
        configuration,
        {
          enabled,
          main: "foo.mjs",
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
      },
      "/cwd",
    ),
  ),
  false,
);
