import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

const { undefined, Promise } = globalThis;

const { expect, expectSuccess, expectSuccessAsync } = Expect(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(expect(true, "%s", "foo"), undefined);
assertEqual(
  expectSuccess(() => 123, "%O"),
  123,
);
await expectSuccessAsync(Promise.resolve(123), "%O");
