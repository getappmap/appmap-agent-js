import { strict as Assert } from "assert";
import { Counter } from "./counter.mjs";

const counter = new Counter();
Assert.equal(counter.increment() + 1, counter.increment());
