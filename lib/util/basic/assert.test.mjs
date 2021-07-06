
import {strict as Assert} from "assert";
import {assert} from "./assert.mjs";

Assert.throws(
  () => assert(false, "BOUM"),
  /^Error: BOUM/u
);
