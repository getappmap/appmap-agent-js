import { assertEqual } from "../../__fixture__.mjs";

import { print } from "./print.mjs";

assertEqual(print("foo"), "foo");

assertEqual(print(123), "123");

assertEqual(
  print(function f() {}),
  "[object Function]",
);
