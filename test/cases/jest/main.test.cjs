/* eslint local/no-globals: ["error", "require"] */
const { test, expect } = require("@jest/globals");
const { main, mainAsync } = require("./main.cjs");
test("main-sync", () => {
  expect(main()).toBe("main");
});
test("main-async", async () => {
  expect(await mainAsync()).toBe("main");
});
test("main-callback", (done) => {
  mainAsync().then((res) => {
    try {
      expect(res).toBe("main");
      done();
    } catch (error) {
      done(error);
    }
  });
});
