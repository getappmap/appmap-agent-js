import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import HookGroup from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
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
