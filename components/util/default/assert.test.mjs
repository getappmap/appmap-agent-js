import { strict as Assert } from "assert";
import { assert, generateDeadcode } from "./assert.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

assertEqual(assert(true, "foo"), undefined);

assertThrows(() => assert(false, "foo"), /^AssertionError: foo/);

assertThrows(() => generateDeadcode("foo")("bar"), /^AssertionError: foo/);
