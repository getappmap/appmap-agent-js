import { strict as Assert } from "assert";
import Violation from "./index.mjs";

const {
  throwViolation,
  throwViolationAsync,
  catchViolation,
  catchViolationAsync,
} = Violation({});

Assert.equal(
  catchViolation(
    () => {
      throwViolation("foo");
      Assert.fail();
    },
    (message) => `${message}bar`,
  ),
  "foobar",
);

try {
  catchViolation(
    () => {
      throw new Error("foo");
    },
    () => {
      Assert.fail();
    },
  );
  Assert.fail();
} catch ({ message }) {
  Assert.equal(message, "foo");
}

Assert.equal(
  await catchViolationAsync(
    throwViolationAsync("foo"),
    (message) => `${message}bar`,
  ),
  "foobar",
);
try {
  await catchViolationAsync(Promise.reject(new Error("foo")), () => {
    Assert.fail();
  });
  Assert.fail();
} catch ({ message }) {
  Assert.equal(message, "foo");
}
