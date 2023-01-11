import { env } from "node:process";
import { strict as Assert } from "node:assert";
import { describe, it } from "mocha";
import { main } from "./main.mjs";
const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;
const { equal: assertEqual, notEqual: assertNotEqual } = Assert;
assertNotEqual(getOwnPropertyDescriptor(env, "FOO"), undefined);
assertEqual(env.FOO, "BAR");
describe("suite", function () {
  it("case", function () {
    assertEqual(main(), "MAIN");
  });
});
