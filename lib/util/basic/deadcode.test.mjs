
import { strict as Assert } from "assert";
import { deadcode } from "./deadcode.mjs";

Assert.throws(
  deadcode("BOUM"),
  /^Error: BOUM/u
);
