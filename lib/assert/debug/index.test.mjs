import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../src/build.mjs";
import _Assert from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { assert, assertSuccess, assertSuccessAsync } = _Assert(
    await buildTestAsync(import.meta),
  );
  assertEqual(assert(true, "%s", "foo"), undefined);
  assertEqual(
    assertSuccess(() => 123, "%e"),
    123,
  );
  await assertSuccessAsync(Promise.resolve(123), "%e");
};

testAsync();
