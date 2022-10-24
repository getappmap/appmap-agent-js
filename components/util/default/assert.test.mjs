import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { assert, generateDeadcode } from "./assert.mjs";

const { undefined, Error } = globalThis;

assertEqual(assert(true, "foo", Error), undefined);

assertThrow(() => {
  assert(false, "foo", Error);
}, /^Error: foo/u);

assertThrow(() => generateDeadcode("foo", Error)("bar"), /^Error: foo/u);
