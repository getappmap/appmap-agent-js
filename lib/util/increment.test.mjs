import { strict as Assert } from "assert";
import { makeIncrement } from "./increment.mjs";

const increment = makeIncrement(123, 456);
Assert.equal(increment(), 123 + 456);
Assert.equal(increment(), 123 + 2 * 456);
