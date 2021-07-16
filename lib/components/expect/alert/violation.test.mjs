import { strict as Assert } from "assert";

global.alert = () => {};
global.setTimeout = (closure, timer) => {
  Assert.throws(closure);
};

(async () => {
  const {
    throwViolation,
    throwViolationAsync,
    catchViolation,
    catchViolationAsync,
  } = await import("./violation.mjs");
  try {
    throwViolation("foo");
    Assert.fail();
  } catch ({ message }) {
    Assert.equal(message, "Violation notification >> foo");
  }
  try {
    await throwViolationAsync("foo");
    Assert.fail();
  } catch ({ message }) {
    Assert.equal(message, "Asynchronous violation notification >> foo");
  }
  Assert.equal(
    catchViolation(
      () => 123,
      () => {
        Assert.fail();
      },
    ),
    123,
  );
  Assert.equal(
    await catchViolationAsync(Promise.resolve(123), () => {
      Assert.fail();
    }),
    123,
  );
})().catch((error) => {
  throw error;
});
