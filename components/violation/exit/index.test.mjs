import { assertEqual, assertFail, assertThrow } from "../../__fixture__.mjs";

const { process, Promise } = globalThis;

process.exit = () => {};
globalThis.setTimeout = (closure, _timer) => {
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
