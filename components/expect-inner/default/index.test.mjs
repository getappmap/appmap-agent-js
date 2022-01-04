import { assertEqual, assertThrow, assertFail } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";

const {
  expect,
  expectDeadcode,
  expectDeadcodeAsync,
  expectSuccess,
  expectSuccessAsync,
} = Expect(await buildTestDependenciesAsync(import.meta.url));

assertEqual(expect(true, "%s", "foo"), undefined);

assertThrow(() => expect(false, "%s", "foo"), /^AppmapError: foo/);

assertThrow(
  () => expectDeadcode("%s %s", "foo")("bar"),
  /^AppmapError: foo bar/,
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
  expectSuccess(() => 123, "%e"),
  123,
);

try {
  expectSuccess(
    () => {
      throw new Error("foo");
    },
    "%s %e",
    "bar",
  );
  assertFail();
} catch ({ message }) {
  assertEqual(message, "bar foo");
}

await expectSuccessAsync(Promise.resolve(123), "%e");

try {
  await expectSuccessAsync(Promise.reject(new Error("foo")), "%s %e", "bar");
  assertFail();
} catch ({ message }) {
  assertEqual(message, "bar foo");
}
