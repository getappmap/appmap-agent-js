import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookNativeModule from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookModule, unhookModule } = HookNativeModule(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookModule,
      unhookModule,
      { hooks: { esm: false, cjs: false } },
      async () => {},
    ),
    [],
  );
};

testAsync();
