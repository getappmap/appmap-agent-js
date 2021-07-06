import { strict as Assert } from "assert";
import { throwError } from "./throw.mjs";

Assert.throws(
  () => throwError(new Error("BOUM")),
  /^Error: BOUM/
);
