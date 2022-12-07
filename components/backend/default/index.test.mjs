import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createBackend,
  sendBackend,
  getBackendTrackIterator,
  getBackendTraceIterator,
  hasBackendTrace,
  hasBackendTrack,
  takeBackendTrace,
} from "./index.mjs";

const {
  undefined,
  Array: { from: toArray },
} = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  { name: "name", validate: { message: true } },
  null,
);

{
  const backend = createBackend(configuration);
  // record1 >> stop one && standard message //
  assertEqual(
    sendBackend(backend, {
      type: "start",
      track: "record1",
      configuration: { name: "name1" },
      url: null,
    }),
    undefined,
  );
  assertEqual(
    sendBackend(backend, {
      type: "error",
      error: {
        type: "number",
        print: "123",
      },
    }),
    undefined,
  );
  assertEqual(hasBackendTrace(backend, "record1"), false);
  assertDeepEqual(toArray(getBackendTrackIterator(backend)), ["record1"]);
  assertEqual(
    sendBackend(backend, {
      type: "stop",
      track: "record1",
      termination: {
        type: "manual",
      },
    }),
    undefined,
  );
  assertDeepEqual(toArray(getBackendTraceIterator(backend)), ["record1"]);
  assertEqual(hasBackendTrack(backend, "record1"), false);
  assertDeepEqual(takeBackendTrace(backend, "record1"), {
    head: configuration,
    body: [
      {
        type: "start",
        track: "record1",
        configuration: { name: "name1" },
        url: null,
      },
      {
        type: "error",
        error: {
          type: "number",
          print: "123",
        },
      },
      {
        type: "stop",
        track: "record1",
        termination: {
          type: "manual",
        },
      },
    ],
  });
  // record2 >> stop all && source message //
  assertEqual(
    sendBackend(backend, {
      type: "source",
      url: "protocol://host/cwd/main.js",
      content: "function main () {}",
      shallow: false,
      inline: false,
      exclude: [],
    }),
    undefined,
  );
  assertEqual(
    sendBackend(backend, {
      type: "start",
      track: "record2",
      configuration: { name: "name2" },
      url: null,
    }),
    undefined,
  );
  assertEqual(
    sendBackend(backend, {
      type: "stop",
      track: null,
      termination: {
        type: "manual",
      },
    }),
    undefined,
  );
  assertDeepEqual(takeBackendTrace(backend, "record2"), {
    head: configuration,
    body: [
      {
        type: "source",
        url: "protocol://host/cwd/main.js",
        content: "function main () {}",
        shallow: false,
        inline: false,
        exclude: [],
      },
      {
        type: "start",
        track: "record2",
        configuration: { name: "name2" },
        url: null,
      },
      {
        type: "stop",
        track: null,
        termination: {
          type: "manual",
        },
      },
    ],
  });
}
