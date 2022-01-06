import { assertEqual } from "../../__fixture__.mjs";
import { print } from "./print.mjs";

assertEqual(print(true), "true");
assertEqual(print("foo"), '"foo"');
assertEqual(print([]), "[object Array]");
