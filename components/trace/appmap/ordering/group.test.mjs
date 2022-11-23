import { assertDeepEqual } from "../../../__fixture__.mjs";
import { groupStack } from "./group.mjs";

const makeEvent = (site, group, payload) => ({
  type: "event",
  site,
  tab: 0,
  group,
  time: 0,
  payload,
});

const makeGroupPayload = (group, description) => ({
  type: "group",
  group,
  description,
});

const makeUngroupPayload = () => ({ type: "ungroup" });

const makeBundlePayload = () => ({ type: "bundle" });

const makeGroupBeginEvent = (group1, group2, description) =>
  makeEvent("begin", group1, makeGroupPayload(group2, description));

const makeResumeEndEvent = (group) =>
  makeEvent("end", group, makeUngroupPayload());

const makeBundleBeginEvent = (group) =>
  makeEvent("begin", group, makeBundlePayload());

const makeBundleEndEvent = (group) =>
  makeEvent("end", group, makeBundlePayload());

// group following //
assertDeepEqual(
  groupStack([
    {
      enter: makeGroupBeginEvent(123, 456, "description"),
      children: [],
      leave: makeResumeEndEvent(123),
    },
    {
      enter: makeBundleBeginEvent(456),
      children: [],
      leave: makeBundleEndEvent(456),
    },
  ]),
  [
    {
      enter: makeGroupBeginEvent(123, 456, "description"),
      children: [
        {
          enter: makeBundleBeginEvent(456),
          children: [],
          leave: makeBundleEndEvent(456),
        },
      ],
      leave: makeResumeEndEvent(123),
    },
  ],
);

// group preceding //
assertDeepEqual(
  groupStack([
    {
      enter: makeBundleBeginEvent(456),
      children: [],
      leave: makeBundleEndEvent(456),
    },
    {
      enter: makeGroupBeginEvent(123, 456, "description"),
      children: [],
      leave: makeResumeEndEvent(123),
    },
  ]),
  [
    {
      enter: makeGroupBeginEvent(123, 456, "description"),
      children: [
        {
          enter: makeBundleBeginEvent(456),
          children: [],
          leave: makeBundleEndEvent(456),
        },
      ],
      leave: makeResumeEndEvent(123),
    },
  ],
);

// group with multiple frames //
// group preceding //
assertDeepEqual(
  groupStack([
    {
      enter: makeBundleBeginEvent(123),
      children: [],
      leave: makeBundleEndEvent(123),
    },
    {
      enter: makeBundleBeginEvent(123),
      children: [],
      leave: makeBundleEndEvent(123),
    },
  ]),
  [
    {
      enter: makeBundleBeginEvent(123),
      children: [],
      leave: makeBundleEndEvent(123),
    },
    {
      enter: makeBundleBeginEvent(123),
      children: [],
      leave: makeBundleEndEvent(123),
    },
  ],
);
