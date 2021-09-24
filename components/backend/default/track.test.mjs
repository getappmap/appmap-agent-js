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

const { createTrack, compileTrack, addTrackEvent } = Track(dependencies);

const configuration = createConfiguration("/cwd");

const initialization = {
  path: null,
  data: {},
};

const termination = {
  errors: [],
  status: 0,
};

{
  const track = createTrack(configuration, {
    ...initialization,
    data: {
      output: null,
    },
  });
  addTrackEvent(track, {
    type: "begin",
    index: 1,
    time: 0,
    data: {
      type: "bundle",
    },
  });
  const {
    path,
    data: {
      metadata: { test_status },
    },
  } = compileTrack(track, [], { ...termination, status: 1 });
  assertEqual(path, null);
  assertEqual(test_status, "failed");
}

{
  const track = createTrack(configuration, {
    ...initialization,
    path: "/root",
    data: {
      output: {
        directory: "directory",
        extension: ".extension",
      },
    },
  });
  const { path } = compileTrack(track, [], termination);
  assertEqual(path, "/root/directory/anonymous.extension");
}
