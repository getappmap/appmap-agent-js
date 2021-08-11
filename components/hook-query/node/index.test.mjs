import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookQuery from "./index.mjs";

const {
  // ok: assert,
  // equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
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
