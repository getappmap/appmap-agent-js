import { strict as Assert } from "assert";
import { assert } from "./assert.mjs";
const { throws: assertThrows } = Assert;

assert(true, "foo");

assertThrows(() => assert(false, "%s%s", "foo", "bar"), /^Error: foobar$/);
