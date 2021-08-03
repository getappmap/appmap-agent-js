import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
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
  const { hookQueryAsync } = HookQuery(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookQueryAsync,
      { conf: { hooks: { mysql: false, pg: false, sqlite3: false } } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
