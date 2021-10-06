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
  global.GLOBAL_SPY_FORK = (path, argv, options) => ({ path, argv, options });
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { spawn, fork } = Spawn(dependencies);
  assertDeepEqual(spawn("exec", ["argv0"], {}), {
    exec: "exec",
    argv: ["argv0"],
    options: {},
  });
  assertDeepEqual(fork("path", ["argv0"], {}), {
    path: "path",
    argv: ["argv0"],
    options: {},
  });
};

testAsync();
