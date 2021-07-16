import { strict as Assert } from "assert";
import { constant } from "./constant.mjs";

Assert.equal(constant(123)(), 123);
