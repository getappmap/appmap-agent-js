/* eslint-env node */

import { assertThrow, assertFail, assertEqual } from "../../__fixture__.mjs";

const { Promise } = globalThis;

globalThis.alert = () => {};
globalThis.setTimeout = (closure, _timer) => {
  assertThrow(closure);
};

const {
  throwViolation,
  throwViolationAsync,
  catchViolation,
  catchViolationAsync,
} = await import("./index.mjs?env=test");

try {
  throwViolation("foo");
  assertFail();
} catch ({ message }) {
  assertEqual(message, "Violation notification >> foo");
}
try {
  await throwViolationAsync("foo");
  assertFail();
} catch ({ message }) {
  assertEqual(message, "Asynchronous violation notification >> foo");
}
assertEqual(
  catchViolation(
    () => 123,
    () => {
      assertFail();
    },
  ),
  123,
);
assertEqual(
  await catchViolationAsync(Promise.resolve(123), () => {
    assertFail();
  }),
  123,
);
