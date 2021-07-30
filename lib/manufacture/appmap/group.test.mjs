import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Group from "./group.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta);

  const { orderByGroup } = Group(dependencies);

  // general //

  assertDeepEqual(
    orderByGroup([
      {
        type: "event",
        data: {
          group: 1,
          data: "event1",
        },
      },
      {
        type: "group",
        data: {
          index: 2,
          parent: 1,
        },
      },
      {
        type: "event",
        data: {
          group: 3,
          data: "event2",
        },
      },
      {
        type: "event",
        data: {
          group: 1,
          data: "event3",
        },
      },
      {
        type: "event",
        data: {
          group: 2,
          data: "event4",
        },
      },
    ]),
    [
      {
        group: 1,
        data: "event1",
      },
      {
        group: 2,
        data: "event4",
      },
      {
        group: 1,
        data: "event3",
      },
      {
        group: 3,
        data: "event2",
      },
    ],
  );

  // group without knew parent //

  assertDeepEqual(
    orderByGroup([
      {
        type: "group",
        data: {
          index: 2,
          parent: 1,
        },
      },
      {
        type: "event",
        data: {
          group: 1,
          data: "event1",
        },
      },
      {
        type: "event",
        data: {
          group: 2,
          data: "event2",
        },
      },
    ]),
    [
      {
        group: 2,
        data: "event2",
      },
      {
        group: 1,
        data: "event1",
      },
    ],
  );
};

testAsync();
