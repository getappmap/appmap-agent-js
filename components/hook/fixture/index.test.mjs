import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Hook from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
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
