import {
  assertDeepEqual,
  assertEqual,
  assertThrow,
} from "../../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Matching from "./matching.mjs";

const { isMatchingEvent, manufactureMatchingEvent } = Matching(
  await buildTestDependenciesAsync(import.meta.url),
);

const event1 = {
  type: "event",
  site: "begin",
  tab: 123,
  group: 0,
  time: 0,
  payload: {
    type: "apply",
    function: "function",
    this: {
      type: "number",
      print: "123",
    },
    arguments: [],
  },
};

const event2 = manufactureMatchingEvent(event1);

assertThrow(() => {
  manufactureMatchingEvent({ ...event1, site: "end" });
});

assertDeepEqual(
  event2,
  manufactureMatchingEvent(manufactureMatchingEvent(event2)),
);

assertEqual(isMatchingEvent(event1, event2), true);

assertEqual(isMatchingEvent(event1, event1), false);

assertEqual(isMatchingEvent({ ...event1, tab: 456 }, event2), false);

assertEqual(
  isMatchingEvent(
    { ...event1, payload: { ...event1.payload, function: "FUNCTION" } },
    event2,
  ),
  false,
);
