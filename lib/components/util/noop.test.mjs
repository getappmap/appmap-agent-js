import { strict as Assert } from "assert";
import { noop } from "./noop.mjs";

Assert.equal(noop(), undefined);
