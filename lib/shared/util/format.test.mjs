
import {strict: Assert} from "assert";
import {format} from "./format.js";

Assert.equal(
  format("%% %s %o", ["foo", null]),
  "% foo null"
);
