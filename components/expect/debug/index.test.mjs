import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import _Assert from "./index.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { expect, expectSuccess, expectSuccessAsync } = _Assert(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  assertEqual(expect(true, "%s", "foo"), undefined);
  assertEqual(
    expectSuccess(() => 123, "%e"),
    123,
  );
  await expectSuccessAsync(Promise.resolve(123), "%e");
};

testAsync();
