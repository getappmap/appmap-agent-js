import { assertEqual } from "../../__fixture__.mjs";

import { print, toInteger } from "./print.mjs";

assertEqual(print("foo"), "foo");

assertEqual(print(123), "123");

assertEqual(
  print(function f() {}),
  "[object Function]",
);

assertEqual(toInteger("123"), 123);

assertEqual(toInteger("foo"), -1);

assertEqual(toInteger(123.456), 123);

assertEqual(toInteger(Symbol("foo")), -1);
