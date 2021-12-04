import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import _Assert from "./index.mjs";

const { equal: assertEqual } = Assert;

const { expect, expectSuccess, expectSuccessAsync } = _Assert(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(expect(true, "%s", "foo"), undefined);
assertEqual(
  expectSuccess(() => 123, "%e"),
  123,
);
await expectSuccessAsync(Promise.resolve(123), "%e");
