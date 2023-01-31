/* eslint local/no-globals: ["error", "require"] */
const { test, expect } = require("@jest/globals");
const main = require("./main.json");
test("main", () => {
  expect(main).toEqual({ foo: "bar" });
});
