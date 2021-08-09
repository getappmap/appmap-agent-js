import { strict as Assert } from "assert";
<<<<<<< HEAD:components/expect-inner/default/index.test.mjs
import { buildDependenciesAsync } from "../../build.mjs";
import Expect from "./index.mjs";
=======
import { buildDependenciesAsync } from "../build.mjs";
import Expect from "./expect.mjs";
>>>>>>> dccffdd00efd62624d438940f4333fbe0c7bedc0:components/expect/expect.test.mjs

const { equal: assertEqual, throws: assertThrows, fail: assertFail } = Assert;

const testAsync = async () => {
  const {
    expect,
    expectDeadcode,
    expectDeadcodeAsync,
    expectSuccess,
    expectSuccessAsync,
  } = Expect(await buildDependenciesAsync(import.meta.url, "test"));

  assertEqual(expect(true, "%s", "foo"), undefined);

  assertThrows(() => expect(false, "%s", "foo"), /^AppmapError: foo/);

  assertThrows(
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
};

testAsync();
