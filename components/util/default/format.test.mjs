import { strict as Assert } from "assert";
import { format } from "./format.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

assertThrows(
  () => format("%x", [123]),
  /^AssertionError: invalid format marker/u,
);

assertThrows(() => format("%s", []), /^AssertionError: missing format value/u);

assertThrows(() =>
  format("foo", ["bar"], /^AssertionError: missing format marker/u),
);

assertEqual(format("%%", []), "%");

// %s //

assertEqual(format("%s", ["foo"]), "foo");

assertThrows(() => format("%s", [123]), /^AssertionError: expected a string/u);

// %j //

assertEqual(format("%j", [[123]]), "[123]");

// % o //

assertEqual(format("%o", [() => {}]), "[object Function]");

// %e //

assertEqual(format("%e", [new Error("foo")]), "foo");

assertThrows(
  () => format("%e", [null]),
  /^AssertionError: expected an object/u,
);

assertThrows(
  () => format("%e", [{}]),
  /^AssertionError: missing 'message' property/u,
);

assertThrows(
  () => format("%e", [{ message: 123 }]),
  /^AssertionError: expected 'message' property value to be a string/u,
);
