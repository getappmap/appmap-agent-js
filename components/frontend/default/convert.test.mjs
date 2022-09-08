import { assertEqual } from "../../__fixture__.mjs";

import { toString, toInteger } from "./convert.mjs";

assertEqual(toString("foo"), "foo");

assertEqual(toString(123), "123");

assertEqual(
  toString(function f() {}),
  "[object Function]",
);

assertEqual(toInteger("123"), 123);

assertEqual(toInteger("foo"), -1);

assertEqual(toInteger(123.456), 123);

assertEqual(toInteger(Symbol("foo")), -1);
