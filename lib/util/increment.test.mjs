import { strict as Assert } from "assert";
import { createIncrement } from "./increment.mjs";

const increment = makeIncrement(123, 456);
Assert.equal(increment(), 123 + 456);
Assert.equal(increment(), 123 + 2 * 456);
