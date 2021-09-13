import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Placeholder from "./placeholder.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { resolvePlaceholder } = Placeholder(dependencies);

// general //

assertDeepEqual(
  resolvePlaceholder([
    {
      type: "event",
      data: {
        type: "placeholder",
        index: 1,
        group: 1,
        time: 123,
        data: {
          type: "placeholder",
          index: 2,
        },
      },
    },
    {
      type: "event",
      data: {
        type: "end",
        index: 1,
        group: 1,
        time: 456,
        data: {
          type: "bundle",
        },
      },
    },
    {
      type: "group",
      data: {
        group: 2,
        origin: 1,
        description: "description",
      },
    },
    {
      type: "event",
      data: {
        type: "begin",
        index: 2,
        group: 2,
        time: 789,
        data: {
          type: "bundle",
        },
      },
    },
  ]),
  [
    {
      type: "event",
      data: {
        type: "begin",
        index: 1,
        group: 1,
        time: 123,
        data: {
          type: "bundle",
        },
      },
    },
    {
      type: "event",
      data: {
        type: "end",
        index: 1,
        group: 1,
        time: 456,
        data: {
          type: "bundle",
        },
      },
    },
    {
      type: "group",
      data: {
        group: 2,
        origin: 1,
        description: "description",
      },
    },
  ],
);
