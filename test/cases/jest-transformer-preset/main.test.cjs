/* eslint local/no-globals: ["error", "require"] */
const { test, expect } = require("@jest/globals");
const { main } = require("./main.cjs");
test("main", () => {
  expect(main()).toBe("main");
});
