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
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookModule, unhookModule } = HookNativeModule(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookModule,
      unhookModule,
      {
        conf: { hooks: { esm: false, cjs: false } },
      },
      async () => {},
    ),
    [],
  );
};

testAsync();
