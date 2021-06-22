import { strict as Assert } from "assert";
import { format } from "./format.mjs";

Assert.equal(format("%% %s %o", ["foo", null]), "% foo null");
