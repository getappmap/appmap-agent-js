import { assertDeepEqual } from "../../../__fixture__.mjs";
import { orderEventArray } from "./index.mjs?env=test";

export const generateMakeEvent = (site, type) => (tab) => ({
  type: "event",
  site,
  tab,
  group: 0,
  time: 0,
  payload: { type },
});

export const makeBeginEvent = generateMakeEvent("begin", "bundle");

export const makeEndEvent = generateMakeEvent("end", "bundle");

export const makeBeforeEvent = generateMakeEvent("before", "jump");

export const makeAfterEvent = generateMakeEvent("after", "jump");

assertDeepEqual(
  orderEventArray([
    makeBeginEvent(123),
    makeBeforeEvent(123),
    makeBeginEvent(456),
    makeAfterEvent(123),
    makeEndEvent(123),
    makeEndEvent(456),
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(123),
      children: [
        {
          type: "jump",
          before: makeBeforeEvent(123),
          after: makeAfterEvent(123),
        },
      ],
      end: makeEndEvent(123),
    },
    {
      type: "bundle",
      begin: makeBeginEvent(456),
      children: [],
      end: makeEndEvent(456),
    },
  ],
);
