import { strict as Assert } from "assert";
import { buildTestAsync } from "../../build/index.mjs";
import Format from "./format.mjs";

const { equal: assertEqual, throws: assertThrows } = Assert;

const testAsync = async () => {
  const { format } = Format(await buildTestAsync(import.meta));

  assertThrows(
    () => format("%x", [123]),
    /^AppmapError: invalid format marker/u,
  );

  assertThrows(() => format("%s", []), /^AppmapError: missing format value/u);

  assertThrows(() =>
    format("foo", ["bar"], /^AppmapError: missing format marker/u),
  );

  assertEqual(format("%%", []), "%");

  // %s //

  assertEqual(format("%s", ["foo"]), "foo");

  assertThrows(() => format("%s", 123), /^AppmapError: expected a string/u);

  // %j //

  assertEqual(format("%j", [[123]]), "[123]");

  // % o //

  assertEqual(format("%o", [() => {}]), "[object Function]");

  // %e //

  assertEqual(format("%e", [new Error("foo")]), "foo");

  assertThrows(() => format("%e", [null]), /^AppmapError: expected an error/u);

  assertThrows(
    () => format("%e", [{}]),
    /^AppmapError: missing error message property/u,
  );

  assertThrows(
    () => format("%e", [{ message: 123 }]),
    /^AppmapError: expected error message property to be a string/u,
  );
};

testAsync();
