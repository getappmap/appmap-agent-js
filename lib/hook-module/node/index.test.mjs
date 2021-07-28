import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import HookNativeModule from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook", "util"],
  });
  const {
    util: { createBox },
    hook: { testHookAsync },
  } = dependencies;
  const { hookModuleAsync } = HookNativeModule(dependencies);
  const box = createBox(null);
  assertDeepEqual(
    await testHookAsync(
      hookModuleAsync,
      {
        box,
      },
      async () => {},
    ),
    [],
  );
};

testAsync();
