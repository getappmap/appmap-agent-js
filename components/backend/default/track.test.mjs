import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Track from "./track.mjs";

Error.stackTraceLimit = Infinity;

const {
  equal: assertEqual,
  // deepEqual: assertDeepEqual,
  // throws: assertThrows
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);

const {
  createServedTrack,
  createStoredTrack,
  isStoredTrack,
  isServedTrack,
  addTrackEvent,
  serveTrack,
  storeTrack,
} = Track(dependencies);

const configuration = createConfiguration("/cwd");

const initialization = {
  path: null,
  options: {},
};

const termination = {
  errors: [],
  status: 0,
};

assertEqual(isStoredTrack(createStoredTrack(initialization)), true);

assertEqual(isServedTrack(createServedTrack(initialization)), true);

{
  const track = createServedTrack(initialization);
  addTrackEvent(track, {
    type: "begin",
    index: 1,
    time: 0,
    data: {
      type: "bundle",
    },
  });
  const {
    metadata: { test_status },
  } = serveTrack(
    track,
    { files: [], configuration },
    { ...termination, status: 1 },
  );
  assertEqual(test_status, "failed");
}

{
  const track = createStoredTrack({
    ...initialization,
    path: "/root",
    options: {
      output: {
        directory: "directory",
        extension: ".extension",
      },
    },
  });
  const { path } = storeTrack(track, { files: [], configuration }, termination);
  assertEqual(path, "/root/directory/anonymous.extension");
}
