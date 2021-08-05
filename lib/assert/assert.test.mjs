import { strict as Assert } from "assert";
import { buildTestAsync } from "../../src/build.mjs";
import _Assert from "./assert.mjs";

const { equal: assertEqual, throws: assertThrows, fail: assertFail } = Assert;

const testAsync = async () => {
  const {
    assert,
    assertDeadcode,
    assertDeadcodeAsync,
    assertSuccess,
    assertSuccessAsync,
  } = _Assert(await buildTestAsync(import.meta));

  assertEqual(assert(true, "%s", "foo"), undefined);

  assertThrows(() => assert(false, "%s", "foo"), /^AppmapError: foo/);

  assertThrows(
    () => assertDeadcode("%s %s", "foo")("bar"),
    /^AppmapError: foo bar/,
  );

  try {
    await assertDeadcodeAsync(
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
    assertSuccess(() => 123, "%e"),
    123,
  );

  try {
    assertSuccess(
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

  await assertSuccessAsync(Promise.resolve(123), "%e");

  try {
    await assertSuccessAsync(Promise.reject(new Error("foo")), "%s %e", "bar");
    assertFail();
  } catch ({ message }) {
    assertEqual(message, "bar foo");
  }
};

testAsync();
