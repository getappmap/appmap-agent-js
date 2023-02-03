import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { AssertionError, assert, generateDeadcode } from "./index.mjs";

const { undefined, Error } = globalThis;

// AssertionError //

assertEqual(new AssertionError("message").name, "AssertionError");

// assert //

assertThrow(
  () => assert(123, "message", Error),
  /^Error: expected assertion check to be a boolean$/u,
);

assertThrow(
  () => assert(true, 123, Error),
  /^Error: expected assertion message to be a string$/u,
);

assertThrow(
  () => assert(true, "message", 123),
  /^Error: expected assertion constructor to be a function$/u,
);

assertEqual(assert(true, "foo", Error), undefined);

assertThrow(() => {
  assert(false, "foo", Error);
}, /^Error: foo/u);

// generateDeadcode //

assertThrow(
  () => generateDeadcode(123, Error),
  /^Error: expected deadcode message to be a string$/u,
);

assertThrow(
  () => generateDeadcode("message", 123),
  /^Error: expected deadcode constructor to be a function$/u,
);

assertThrow(() => generateDeadcode("foo", Error)("bar"), /^Error: foo/u);
