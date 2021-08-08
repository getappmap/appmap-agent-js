import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Hook from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildDependenciesAsync(import.meta.url, "test");
  const { testHookAsync } = Hook(dependencies);
  assertDeepEqual(
    await testHookAsync(
      () => {},
      () => {},
      {},
      async () => {},
    ),
    [],
  );
};

testAsync();
