import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import _Assert from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { assert, assertSuccess, assertSuccessAsync } = _Assert(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  assertEqual(assert(true, "%s", "foo"), undefined);
  assertEqual(
    assertSuccess(() => 123, "%e"),
    123,
  );
  await assertSuccessAsync(Promise.resolve(123), "%e");
};

testAsync();
