import { strict as Assert } from "assert";
const { throws: assertThrows } = Assert;

global.EXPECT_TEST = null;

const { expect } = await import("./expect.mjs");

expect(true, "foo");

assertThrows(
  () => expect(false, "%s%s", "foo", "bar"),
  /^Error: Expection failure/,
);
