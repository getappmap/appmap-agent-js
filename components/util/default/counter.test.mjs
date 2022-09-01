import { assertEqual } from "../../__fixture__.mjs";
import {
  createCounter,
  incrementCounter,
  decrementCounter,
  gaugeCounter,
} from "./counter.mjs";

const counter = createCounter(0);
assertEqual(gaugeCounter(counter), 0);
assertEqual(incrementCounter(counter), 1);
assertEqual(incrementCounter(counter), 2);
assertEqual(decrementCounter(counter), 1);
assertEqual(decrementCounter(counter), 0);
