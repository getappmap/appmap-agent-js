import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Spawn from "./index.mjs";

const {
  fail: assertFail,
  deepEqual: assertDeepEqual,
  equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { spawnAsync } = Spawn(dependencies);
  assertDeepEqual(await spawnAsync("/bin/sh", ["-c", "exit 0"], {}), {
    status: 0,
    signal: null,
  });
  try {
    await spawnAsync("missing-executable-file", [], {});
    assertFail();
  } catch ({ code }) {
    assertEqual(code, "ENOENT");
  }
};

testAsync();
