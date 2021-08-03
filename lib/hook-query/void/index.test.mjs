import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import HookModule from "./index.mjs";

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
  const { hookQuery, unhookQuery } = HookModule(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookQuery,
      unhookQuery,
      { conf: { hooks: { cjs: false, esm: false } } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
