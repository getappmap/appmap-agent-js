import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import HookQuery from "./index.mjs";

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
  const { hookQuery, unhookQuery } = HookQuery(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookQuery,
      unhookQuery,
      { conf: { hooks: { mysql: false, pg: false, sqlite3: false } } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
