import { env } from "node:process";
import { strict as Assert } from "node:assert";
const {
  undefined,
  Reflect: { getOwnPropertyDescriptor },
} = globalThis;
const { equal: assertEqual, notEqual: assertNotEqual } = Assert;
assertNotEqual(getOwnPropertyDescriptor(env, "FOO"), undefined);
assertEqual(env.FOO, "BAR");
