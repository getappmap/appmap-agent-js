import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { format } from "./format.mjs";

const { Error } = globalThis;

assertThrow(() => format("%x", [123]), /^Error: invalid format marker/u);

assertThrow(() => format("%s", []), /^AssertionError: missing format value/u);

assertThrow(() =>
  format("foo", ["bar"], /^AssertionError: missing format marker/u),
);

assertEqual(format("%%", []), "%");

// %f //

assertEqual(format("%f", [() => "foo"]), "foo");

assertThrow(
  () => format("%f", [() => 123]),
  /^AssertionError: expected a string as result/u,
);

// %s //

assertEqual(format("%s", ["foo"]), "foo");

assertThrow(() => format("%s", [123]), /^AssertionError: expected a string/u);

// %j //

assertEqual(format("%j", [[123]]), "[123]");

// % o //

assertEqual(format("%o", [() => {}]), "[function]");

// %O //

assertEqual(format("%O", [{ toString: () => "foo" }]), "foo");

assertEqual(
  format("%O", [
    {
      toString: () => {
        throw new Error("BOUM");
      },
    },
  ]),
  "[object]",
);
