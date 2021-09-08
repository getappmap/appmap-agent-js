import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Track from "./track.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { collectTracks } = Track(dependencies);

assertDeepEqual(
  collectTracks([
    {
      type: "track",
      data: {
        type: "start",
        index: 123,
        configuration: { output: { filename: "filename" } },
      },
    },
    {
      type: "event",
      data: {
        type: "begin",
        time: 0,
        index: 1,
        group: 0,
        data: {
          type: "apply",
          route: "/route",
        },
      },
    },
    {
      type: "track",
      data: {
        type: "pause",
        index: 123,
      },
    },
    {
      type: "event",
      data: {
        type: "begin",
        time: 0,
        index: 2,
        group: 0,
        data: {
          type: "bundle",
        },
      },
    },
    {
      type: "track",
      data: {
        type: "stop",
        index: 123,
      },
    },
  ]),
  [
    {
      configuration: { output: { filename: "filename" } },
      slice: new Set([1]),
      routes: new Set(["/route"]),
    },
  ],
);
