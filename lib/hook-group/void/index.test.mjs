import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
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
    deps: ["hook", "state"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookGroupAsync } = HookGroup(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookGroupAsync,
      { conf: { hooks: { group: false } } },
      async (state) => null,
    ),
    [],
  );
};

testAsync();
