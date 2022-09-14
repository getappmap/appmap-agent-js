import { assertEqual } from "../../__fixture__.mjs";
import {
  toBoolean,
  toNumber,
  jsonifyNumber,
  print,
  toString,
} from "./convert.mjs";

const {
  Number: { NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY },
} = globalThis;

// toBoolean //
assertEqual(toBoolean(1), true);
assertEqual(toBoolean(0), false);

// toNumber //
assertEqual(toNumber(123), 123);
assertEqual(toNumber("123"), 123);
assertEqual(toNumber(123n), 123);
assertEqual(toNumber(null), NaN);

// jsonifyNumber //
{
  const replacements = {
    NaN: 0,
    NEGATIVE_INFINITY: -1,
    POSITIVE_INFINITY: 1,
  };
  assertEqual(jsonifyNumber(123, replacements), 123);
  assertEqual(jsonifyNumber(NaN, replacements), 0);
  assertEqual(jsonifyNumber(NEGATIVE_INFINITY, replacements), -1);
  assertEqual(jsonifyNumber(POSITIVE_INFINITY, replacements), 1);
}

// print //
assertEqual(print(true), "true");
assertEqual(print("foo"), '"foo"');
assertEqual(print([]), "[object Array]");

// toString //
assertEqual(toString(true), "true");
assertEqual(toString("foo"), "foo");
