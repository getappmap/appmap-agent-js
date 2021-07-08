import { strict as Assert } from "assert";
import { expect, expectSuccess, expectDeadcode } from "./expect.mjs";

Assert.throws(() => expect(false, "%s", "foo"), /^AppmapError: foo/);

Assert.equal(
  expectSuccess(() => 123, "%e"),
  123,
);

Assert.throws(
  () =>
    expectSuccess(
      () => {
        throw new Error("foo");
      },
      "%s %e",
      "bar",
    ),
  /^AppmapError: bar foo/,
);

Assert.throws(
  () => expectDeadcode("%s %s", "foo")("bar"),
  /^AppmapError: foo bar/,
);
