import { assertEqual, assertThrow, assertFail } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

const { Error, undefined, Promise } = globalThis;

const {
  expect,
  expectDeadcode,
  expectDeadcodeAsync,
  expectSuccess,
  expectSuccessAsync,
} = Expect(await buildTestDependenciesAsync(import.meta.url));

assertEqual(expect(true, "%s", "foo"), undefined);

assertThrow(() => expect(false, "%s", "foo"), /^AppmapError: foo/u);

assertThrow(
  () => expectDeadcode("%s %s", "foo")("bar"),
  /^AppmapError: foo bar/u,
);

try {
  await expectDeadcodeAsync(
    (error) => {
      throw error;
    },
    "%s %s",
    "foo",
  )("bar");
  assertFail();
} catch ({ message }) {
  assertEqual(message, "foo bar");
}

assertEqual(
  expectSuccess(() => 123, "%O"),
  123,
);

try {
  expectSuccess(
    () => {
      throw new Error("foo");
    },
    "%s %O",
    "bar",
  );
  assertFail();
} catch ({ message }) {
  assertEqual(message, "bar Error: foo");
}

await expectSuccessAsync(Promise.resolve(123), "%O");

try {
  await expectSuccessAsync(Promise.reject(new Error("foo")), "%s %O", "bar");
  assertFail();
} catch ({ message }) {
  assertEqual(message, "bar Error: foo");
}
