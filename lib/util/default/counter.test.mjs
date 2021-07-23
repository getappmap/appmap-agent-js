import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Box from "./box.mjs";

const {equal:assertEqual} = Assert;

const mainAsync = async () => {
  const {
    createCounter,
    incrementCounter,
    decrementCounter,
    getCounterValue,
  } = Counter(
    await buildAsync({
      globals: {LOG_LEVEL: "WARN"},
      violation: "error",
    }),
  );
  const counter = createCounter();
  assertEqual(getCounterValue(counter), 0);
  assertEqual(incrementCounter(counter), 1);
  assertEqual(incrementCounter(counter), 2);
  assertEqual(decrementCounter(counter), 1);
  assertEqual(decrementCounter(counter), 0);
};
