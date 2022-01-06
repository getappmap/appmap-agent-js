import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Stack from "./stack.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { orderByStack } = Stack(dependencies);
const default_event = {
  type: null,
  time: 0,
  group: 0,
  index: null,
  data: null,
};
const default_bundle_event = {
  ...default_event,
  data: { type: "bundle" },
};
const default_jump_event = {
  ...default_event,
  data: { type: "jump" },
};
const default_begin_event = {
  ...default_bundle_event,
  type: "begin",
};
const default_end_event = {
  ...default_bundle_event,
  type: "end",
};
const default_before_event = {
  ...default_jump_event,
  type: "before",
};
const default_after_event = {
  ...default_jump_event,
  type: "after",
};

// general //

assertDeepEqual(
  orderByStack([
    {
      ...default_after_event,
      index: 2,
    },
    {
      ...default_end_event,
      index: 1,
    },
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_before_event,
      index: 2,
    },
  ]),
  [
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_before_event,
      index: 2,
    },
    {
      ...default_after_event,
      index: 2,
    },
    {
      ...default_end_event,
      index: 1,
    },
  ],
);

assertDeepEqual(
  orderByStack([
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_begin_event,
      index: 3,
    },
    {
      ...default_after_event,
      index: 2,
    },
    {
      ...default_end_event,
      index: 1,
    },
    {
      ...default_end_event,
      index: 3,
    },
    {
      ...default_before_event,
      index: 2,
    },
  ]),
  [
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_begin_event,
      index: 3,
    },
    {
      ...default_end_event,
      index: 3,
    },
    {
      ...default_before_event,
      index: 2,
    },
    {
      ...default_after_event,
      index: 2,
    },
    {
      ...default_end_event,
      index: 1,
    },
  ],
);

// completion //

assertDeepEqual(
  orderByStack([
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_before_event,
      index: 2,
    },
  ]),
  [
    {
      ...default_begin_event,
      index: 1,
    },
    {
      ...default_before_event,
      index: 2,
    },
    {
      ...default_after_event,
      index: 2,
    },
    {
      ...default_end_event,
      index: 1,
    },
  ],
);
