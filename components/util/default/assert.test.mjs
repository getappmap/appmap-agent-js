import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { assert, generateDeadcode } from "./assert.mjs";

const { undefined } = globalThis;

assertEqual(assert(true, "foo"), undefined);

assertThrow(() => {
  assert(false, "foo");
}, /^AssertionError: foo/u);

assertThrow(() => generateDeadcode("foo")("bar"), /^AssertionError: foo/u);
