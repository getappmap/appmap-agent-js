
import {strict: Assert} from "assert";
import {print} from "./print.js";

Assert.equal(print(true), "true");
Assert.equal(print("foo"), "\"foo\"");
Assert.equal(print([]), "[object Array]");
