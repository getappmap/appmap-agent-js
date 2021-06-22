import { strict as Assert } from "assert";
import { print } from "./print.mjs";

Assert.equal(print(true), "true");
Assert.equal(print("foo"), '"foo"');
Assert.equal(print([]), "[object Array]");
