import { assertDeepEqual } from "../../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../../build.mjs";

import Stack from "./stack.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { stackify } = Stack(dependencies);

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

// complete
assertDeepEqual(
  stackify([
    makeBeginEvent(123),
    makeBeginEvent(456),
    makeBeforeEvent(789),
    makeEndEvent(123),
    makeAfterEvent(789),
    makeEndEvent(456),
  ]),
  [
    {
      enter: makeBeginEvent(123),
      children: [
        {
          enter: makeBeginEvent(456),
          children: [],
          leave: makeBeforeEvent(789),
        },
      ],
      leave: makeEndEvent(123),
    },
    {
      enter: makeAfterEvent(789),
      children: [],
      leave: makeEndEvent(456),
    },
  ],
);

// missing head
assertDeepEqual(
  stackify([makeBeginEvent(456), makeEndEvent(456), makeEndEvent(123)]),
  [
    {
      enter: makeAfterEvent(457),
      children: [
        {
          enter: makeBeginEvent(456),
          children: [],
          leave: makeEndEvent(456),
        },
      ],
      leave: makeEndEvent(123),
    },
  ],
);

//  missing tail
assertDeepEqual(
  stackify([makeBeginEvent(123), makeBeginEvent(456), makeEndEvent(456)]),
  [
    {
      enter: makeBeginEvent(123),
      children: [
        {
          enter: makeBeginEvent(456),
          children: [],
          leave: makeEndEvent(456),
        },
      ],
      leave: makeBeforeEvent(457),
    },
  ],
);
