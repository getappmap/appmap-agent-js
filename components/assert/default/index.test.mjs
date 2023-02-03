import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { AssertionError, assert, generateDeadcode } from "./index.mjs";

const { undefined, Error } = globalThis;

assertEqual(new AssertionError("message").name, "AssertionError");

assertEqual(assert(true, "foo", Error), undefined);

assertThrow(() => {
  assert(false, "foo", Error);
}, /^Error: foo/u);

assertThrow(() => generateDeadcode("foo", Error)("bar"), /^Error: foo/u);
