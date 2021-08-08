import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookModule from "./index.mjs";

const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookModule, unhookModule, transformSourceDefault } =
    HookModule(dependencies);
  assertEqual(
    transformSourceDefault("content", "context", (x) => x),
    "content",
  );
  assertDeepEqual(
    await testHookAsync(
      hookModule,
      unhookModule,
      { hooks: { cjs: false, esm: false } },
      async (state) => null,
    ),
    [],
  );
};

testAsync();
