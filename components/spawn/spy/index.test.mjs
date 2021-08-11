/* eslint-env node */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

const {
  // fail: assertFail,
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  global.GLOBAL_SPY_SPAWN = (exec, argv, options) => ({ exec, argv, options });
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { spawn } = Spawn(dependencies);
  assertDeepEqual(spawn("exec", ["argv0"], {}), {
    exec: "exec",
    argv: ["argv0"],
    options: {},
  });
};

testAsync();
