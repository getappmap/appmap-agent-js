import { assertEqual, assertFail } from "../../__fixture__.mjs";
import Violation from "./index.mjs";

const { Error, Promise } = globalThis;

const {
  throwViolation,
  throwViolationAsync,
  catchViolation,
  catchViolationAsync,
} = Violation({});

assertEqual(
  catchViolation(
    () => {
      throwViolation("foo");
      assertFail();
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
      assertFail();
    },
  );
  assertFail();
} catch ({ message }) {
  assertEqual(message, "foo");
}

assertEqual(
  await catchViolationAsync(
    throwViolationAsync("foo"),
    (message) => `${message}bar`,
  ),
  "foobar",
);
try {
  await catchViolationAsync(Promise.reject(new Error("foo")), () => {
    assertFail();
  });
  assertFail();
} catch ({ message }) {
  assertEqual(message, "foo");
}
