import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Batch from "./index.mjs";

const {
  // equal: assertEqual,
  // fail: assertFail,
  // deepEqual: assertDeepEqual
} = Assert;

global.GLOBAL_SPY_SPAWN_ASYNC = (exec, argv, options) => {
  if (exec === "success") {
    return { status: 0, signal: null };
  }
  if (exec === "failure") {
    return { status: 1, signal: null };
  }
  return { status: null, signal: exec };
};

const { mainAsync } = Batch(
  await buildTestDependenciesAsync(import.meta.url, {
    server: "stub",
    spawn: "spy",
  }),
);

const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration");

const configuration = createConfiguration("/repository");

// no child
await mainAsync({ env: {} }, configuration);

// single success child
await mainAsync(
  { env: {} },
  extendConfiguration(configuration, { children: [["success"]] }, "/directory"),
);

// multiple child
await mainAsync(
  { env: {} },
  extendConfiguration(
    configuration,
    {
      children: [["failure"], ["SIGKILL"]],
    },
    "/directory",
  ),
);
