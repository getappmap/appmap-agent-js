import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createEventTarget,
  addEventListener,
  removeEventListener,
  dispatchEvent,
} from "./index.mjs";

const { Infinity } = globalThis;

const target = createEventTarget();

const trace = [];

const log1 = (event) => {
  trace.push("log1", event);
};

const log2 = (event) => {
  trace.push("log2", event);
};

const log3 = (event) => {
  trace.push("log3", event);
};

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  [],
);

addEventListener(target, "name", log1);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  ["log1", "event"],
);

addEventListener(target, "name", log2);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  ["log1", "event", "log2", "event"],
);

addEventListener(target, "name", log3);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  ["log1", "event", "log2", "event", "log3", "event"],
);

removeEventListener(target, "name", log1);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  ["log2", "event", "log3", "event"],
);

removeEventListener(target, "name", log2);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  ["log3", "event"],
);

removeEventListener(target, "name", log3);

assertDeepEqual(
  (dispatchEvent(target, "name", "event"), trace.splice(0, Infinity)),
  [],
);
