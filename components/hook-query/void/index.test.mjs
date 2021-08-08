import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookModule from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookQuery, unhookQuery } = HookModule(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookQuery,
      unhookQuery,
      { hooks: { cjs: false, esm: false } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
