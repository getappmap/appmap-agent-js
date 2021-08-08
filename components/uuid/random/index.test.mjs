import { strict as Assert } from "assert";
import UUID from "./index.mjs";

const { equal: assertEqual, notEqual: assertNotEqual } = Assert;

const testAsync = async () => {
  const { getUUID } = UUID({});
  assertEqual(typeof getUUID(), "string");
  assertEqual(getUUID().length, 8);
  assertNotEqual(getUUID(), getUUID());
};

testAsync();
