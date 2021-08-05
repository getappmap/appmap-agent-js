import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import HookModule from "./index.mjs";

const {
  // ok: assert,
  equal: assertEqual,
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
      { conf: { hooks: { cjs: false, esm: false } } },
      async (state) => null,
    ),
    [],
  );
};

testAsync();
