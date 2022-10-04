import { assertDeepEqual } from "../../../__fixture__.mjs";
import { jumpify } from "./jump.mjs?env=test";

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

// complete //
assertDeepEqual(
  jumpify([
    {
      enter: makeBeginEvent(1),
      children: [
        {
          enter: makeBeginEvent(2),
          children: [],
          leave: makeEndEvent(2),
        },
      ],
      leave: makeBeforeEvent(3),
    },
    {
      enter: makeAfterEvent(3),
      children: [
        {
          enter: makeBeginEvent(4),
          children: [],
          leave: makeEndEvent(4),
        },
      ],
      leave: makeBeforeEvent(5),
    },
    {
      enter: makeAfterEvent(5),
      children: [
        {
          enter: makeBeginEvent(6),
          children: [],
          leave: makeEndEvent(6),
        },
      ],
      leave: makeEndEvent(1),
    },
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(1),
      children: [
        {
          type: "bundle",
          begin: makeBeginEvent(2),
          children: [],
          end: makeEndEvent(2),
        },
        {
          type: "jump",
          before: makeBeforeEvent(3),
          after: makeAfterEvent(3),
        },
        {
          type: "bundle",
          begin: makeBeginEvent(4),
          children: [],
          end: makeEndEvent(4),
        },
        {
          type: "jump",
          before: makeBeforeEvent(5),
          after: makeAfterEvent(5),
        },
        {
          type: "bundle",
          begin: makeBeginEvent(6),
          children: [],
          end: makeEndEvent(6),
        },
      ],
      end: makeEndEvent(1),
    },
  ],
);

// missing before //
assertDeepEqual(
  jumpify([
    {
      enter: makeAfterEvent(456),
      children: [],
      leave: makeEndEvent(123),
    },
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(123),
      children: [
        {
          type: "jump",
          before: makeBeforeEvent(456),
          after: makeAfterEvent(456),
        },
      ],
      end: makeEndEvent(123),
    },
  ],
);

// missing after //
assertDeepEqual(
  jumpify([
    {
      enter: makeBeginEvent(123),
      children: [],
      leave: makeBeforeEvent(456),
    },
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(123),
      children: [
        {
          type: "jump",
          before: makeBeforeEvent(456),
          after: makeAfterEvent(456),
        },
      ],
      end: makeEndEvent(123),
    },
  ],
);

// missing before and after //
assertDeepEqual(
  jumpify([
    {
      enter: makeAfterEvent(123),
      children: [],
      leave: makeBeforeEvent(456),
    },
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(0),
      children: [
        {
          type: "jump",
          before: makeBeforeEvent(123),
          after: makeAfterEvent(123),
        },
        {
          type: "jump",
          before: makeBeforeEvent(456),
          after: makeAfterEvent(456),
        },
      ],
      end: makeEndEvent(0),
    },
  ],
);

// orphan reverse matching //
assertDeepEqual(
  jumpify([
    {
      enter: makeAfterEvent(456),
      children: [],
      leave: makeBeforeEvent(789),
    },
    {
      enter: makeAfterEvent(123),
      children: [],
      leave: makeBeforeEvent(456),
    },
  ]),
  [
    {
      type: "bundle",
      begin: makeBeginEvent(0),
      children: [
        {
          type: "jump",
          before: makeBeforeEvent(123),
          after: makeAfterEvent(123),
        },
        {
          type: "jump",
          before: makeBeforeEvent(456),
          after: makeAfterEvent(456),
        },
        {
          type: "jump",
          before: makeBeforeEvent(789),
          after: makeAfterEvent(789),
        },
      ],
      end: makeEndEvent(0),
    },
  ],
);
