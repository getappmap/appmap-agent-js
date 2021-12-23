import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { format } from "./format.mjs";

assertThrow(
  () => format("%x", [123]),
  /^AssertionError: invalid format marker/u,
);

assertThrow(() => format("%s", []), /^AssertionError: missing format value/u);

assertThrow(() =>
  format("foo", ["bar"], /^AssertionError: missing format marker/u),
);

assertEqual(format("%%", []), "%");

// %s //

assertEqual(format("%s", ["foo"]), "foo");

assertThrow(() => format("%s", [123]), /^AssertionError: expected a string/u);

// %j //

assertEqual(format("%j", [[123]]), "[123]");

// % o //

assertEqual(format("%o", [() => {}]), "[object Function]");

// %e //

assertEqual(format("%e", [new Error("foo")]), "foo");

assertThrow(() => format("%e", [null]), /^AssertionError: expected an object/u);

assertThrow(
  () => format("%e", [{}]),
  /^AssertionError: missing 'message' property/u,
);

assertThrow(
  () => format("%e", [{ message: 123 }]),
  /^AssertionError: expected 'message' property value to be a string/u,
);
