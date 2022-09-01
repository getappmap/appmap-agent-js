import { assertDeepEqual } from "../../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../../build.mjs";
import Group from "./group.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { groupStack } = Group(dependencies);

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

assertDeepEqual(
  groupStack([
    {
      enter: makeBundleBeginEvent(123),
      children: [
        {
          enter: makeGroupBeginEvent(123, 456, "description"),
          children: [],
          leave: makeResumeEndEvent(123),
        },
      ],
      leave: makeBundleEndEvent(123),
    },
    {
      enter: makeBundleBeginEvent(456),
      children: [],
      leave: makeBundleEndEvent(456),
    },
    {
      enter: makeBundleBeginEvent(456),
      children: [],
      leave: makeBundleEndEvent(456),
    },
  ]),
  [
    {
      enter: makeBundleBeginEvent(123),
      children: [
        {
          enter: makeGroupBeginEvent(123, 456, "description"),
          children: [
            {
              enter: makeBundleBeginEvent(456),
              children: [],
              leave: makeBundleEndEvent(456),
            },
            {
              enter: makeBundleBeginEvent(456),
              children: [],
              leave: makeBundleEndEvent(456),
            },
          ],
          leave: makeResumeEndEvent(123),
        },
      ],
      leave: makeBundleEndEvent(123),
    },
  ],
);
