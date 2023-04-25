import { assertEqual } from "../../__fixture__.mjs";
import {
  toBoolean,
  toNumber,
  toInteger,
  jsonifyNumber,
  print,
  toString,
} from "./convert.mjs";

const {
  Number,
  BigInt,
  Number: { NaN, NEGATIVE_INFINITY, POSITIVE_INFINITY },
} = globalThis;

// toBoolean //
assertEqual(toBoolean(1), true);
assertEqual(toBoolean(0), false);

// toInteger //
assertEqual(toInteger(false), 0);
assertEqual(toInteger(true), 1);
assertEqual(toInteger(123), 123);
assertEqual(toInteger(Number(`1${"0".repeat(100)}`)), POSITIVE_INFINITY);
assertEqual(toInteger(Number(`-1${"0".repeat(100)}`)), NEGATIVE_INFINITY);
assertEqual(toInteger(123.4), 123);
assertEqual(toInteger("123"), 123);
assertEqual(toInteger("123.4"), 123);
assertEqual(toInteger(123n), 123);
assertEqual(toInteger(BigInt(`1${"0".repeat(100)}`)), POSITIVE_INFINITY);
assertEqual(toInteger(BigInt(`-1${"0".repeat(100)}`)), NEGATIVE_INFINITY);
assertEqual(toInteger(null), NaN);

// toNumber //
assertEqual(toNumber(false), 0);
assertEqual(toNumber(true), 1);
assertEqual(toNumber(123), 123);
assertEqual(toNumber("123"), 123);
assertEqual(toNumber(123n), 123);
assertEqual(toNumber(null), NaN);

// toString //
assertEqual(
  toString(function f() {}),
  "[function]",
);
assertEqual(toString([]), "[array]");
assertEqual(toString({}), "[object]");
assertEqual(toString(123), "123");
assertEqual(toString("foo"), "foo");

// toString //
assertEqual(
  print(function f() {}),
  "[function]",
);
assertEqual(print([]), "[array]");
assertEqual(print({}), "[object]");
assertEqual(print(123), "123");
assertEqual(print("foo"), '"foo"');

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
