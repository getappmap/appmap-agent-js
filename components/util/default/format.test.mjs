import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { format } from "./format.mjs";

const {Error} = globalThis;

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
  "[object Object]",
);
