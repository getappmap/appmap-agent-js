import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Hook from "./index.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta);
  const { testHookAsync } = Hook(dependencies);
  assertDeepEqual(
    await testHookAsync(
      async (client, state, configuration) => Promise.resolve(null),
      {},
      async () => {},
    ),
    [],
  );
};

testAsync();
