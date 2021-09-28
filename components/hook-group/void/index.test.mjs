import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookGroup from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
  const { hookGroup, unhookGroup } = HookGroup(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookGroup,
      unhookGroup,
      { ordering: "chronological" },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
