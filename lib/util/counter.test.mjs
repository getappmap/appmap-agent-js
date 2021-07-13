import { strict as Assert } from "assert";
import {
  createCounter,
  incrementCounter,
  decrementCounter,
  getCounterValue,
} from "./counter.mjs";

const counter = createCounter();
Assert.equal(getCounterValue(counter), 0);
Assert.equal(incrementCounter(counter), 1);
Assert.equal(incrementCounter(counter), 2);
Assert.equal(decrementCounter(counter), 1);
Assert.equal(decrementCounter(counter), 0);
