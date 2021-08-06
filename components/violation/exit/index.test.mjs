import { strict as Assert } from "assert";

process.exit = () => {};
global.setTimeout = (closure, timer) => {
  Assert.throws(closure);
};

const testAsync = async () => {
  const { default: Violation } = await import("./index.mjs");
  const {
    throwViolation,
    throwViolationAsync,
    catchViolation,
    catchViolationAsync,
  } = Violation({});
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
};

testAsync();
