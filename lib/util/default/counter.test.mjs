import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Counter from "./counter.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createCounter, incrementCounter, decrementCounter, getCounterValue } =
    Counter(await buildTestAsync(import.meta));
  const counter = createCounter();
  assertEqual(getCounterValue(counter), 0);
  assertEqual(incrementCounter(counter), 1);
  assertEqual(incrementCounter(counter), 2);
  assertEqual(decrementCounter(counter), 1);
  assertEqual(decrementCounter(counter), 0);
};

testAsync();
