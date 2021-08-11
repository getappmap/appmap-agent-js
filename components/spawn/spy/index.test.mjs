/* eslint-env node */

import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

const {
  // fail: assertFail,
  // deepEqual: assertDeepEqual,
  equal: assertEqual,
} = Assert;

const testAsync = async () => {
  global.GLOBAL_SPY_SPAWN_ASYNC = () => Promise.resolve(null);
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { spawnAsync } = Spawn(dependencies);
  assertEqual(await spawnAsync("exec", ["argv0"], {}), null);
};

testAsync();
