import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Track from "./track.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta);

  const { splitTrack } = Track(dependencies);

  assertDeepEqual(
    splitTrack([
      {
        type: "track",
        data: {
          type: "start",
          index: 123,
          options: "options",
        },
      },
      {
        type: "event",
        data: "event1",
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
        data: "event2",
      },
      {
        type: "track",
        data: {
          type: "play",
          index: 123,
        },
      },
      {
        type: "event",
        data: "event3",
      },
    ]),
    [{ options: "options", events: ["event1", "event3"] }],
  );
};

testAsync();
