import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookGroup from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookGroup, unhookGroup } = HookGroup(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookGroup,
      unhookGroup,
      { hooks: { group: false } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
