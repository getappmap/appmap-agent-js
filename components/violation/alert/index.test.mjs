/* eslint-env node */

import { assertThrow, assertFail, assertEqual } from "../../__fixture__.mjs";

global.alert = () => {};
global.setTimeout = (closure, timer) => {
  assertThrow(closure);
};

const { default: Violation } = await import("./index.mjs");
const {
  throwViolation,
  throwViolationAsync,
  catchViolation,
  catchViolationAsync,
} = Violation({});
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
