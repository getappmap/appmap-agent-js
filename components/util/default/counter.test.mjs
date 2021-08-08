import { strict as Assert } from "assert";
import {
  createCounter,
  incrementCounter,
  decrementCounter,
  getCounterValue,
} from "./counter.mjs";

const { equal: assertEqual } = Assert;

const counter = createCounter(0);
assertEqual(getCounterValue(counter), 0);
assertEqual(incrementCounter(counter), 1);
assertEqual(incrementCounter(counter), 2);
assertEqual(decrementCounter(counter), 1);
assertEqual(decrementCounter(counter), 0);
