import { strict as Assert } from "assert";
import { buildAllAsync } from "../../build.mjs";
import Expect from "./expect.mjs";

const mainAsync = async () => {
  class Violation extends Error {
    constructor(message) {
      super(message);
      this.name = "Violation";
    }
  }

  const { expect, expectDeadcode, expectSuccess, expectSuccessAsync } = Expect({
    throwViolation: (message) => {
      throw new Violation(message);
    },
    throwViolationAsync: (message) => Promise.reject(new Violation(message)),
    catchViolation: "catchViolation",
    catchViolationAsync: "catchViolationAsync",
  })(await buildAllAsync(["util"]));

  Assert.equal(expect(true, "%s", "foo"), undefined);

  Assert.throws(() => expect(false, "%s", "foo"), /^Violation: foo/);

  Assert.throws(
    () => expectDeadcode("%s %s", "foo")("bar"),
    /^Violation: foo bar/,
  );

  Assert.equal(
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
    Assert.fail();
  } catch ({ message }) {
    Assert.equal(message, "bar foo");
  }

  await expectSuccessAsync(Promise.resolve(123), "%e");

  try {
    await expectSuccessAsync(Promise.reject(new Error("foo")), "%s %e", "bar");
    Assert.fail();
  } catch ({ message }) {
    Assert.equal(message, "bar foo");
  }
};

mainAsync().catch((error) => {
  throw error;
});
