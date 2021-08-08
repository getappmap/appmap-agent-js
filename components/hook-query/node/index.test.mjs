import { strict as Assert } from "assert";
import { buildDependenciesAsync, buildOneAsync } from "../../build.mjs";
import HookQuery from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = await buildOneAsync("hook", "test");
  const { hookQuery, unhookQuery } = HookQuery(dependencies);
  assertDeepEqual(
    await testHookAsync(
      hookQuery,
      unhookQuery,
      { hooks: { mysql: false, pg: false, sqlite3: false } },
      async (frontend) => null,
    ),
    [],
  );
};

testAsync();
