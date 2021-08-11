import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookModule from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
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
