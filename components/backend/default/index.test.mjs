import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  createBackend,
  sendBackend,
  getBackendTrackIterator,
  getBackendTraceIterator,
  hasBackendTrace,
  hasBackendTrack,
  takeBackendTrace,
} from "./index.mjs?env=test";

const {
  undefined,
  Array: { from: toArray },
} = globalThis;

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  { name: "name1" },
  null,
);

{
  const backend = createBackend(configuration);
  assertEqual(
    sendBackend(backend, {
      type: "source",
      url: "file:///cwd/main.js",
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
      track: "record",
      configuration: { name: "name2" },
      url: null,
    }),
    undefined,
  );
  assertEqual(
    sendBackend(backend, {
      type: "error",
      name: "name",
      message: "message",
      stack: "stack",
    }),
    undefined,
  );
  assertEqual(hasBackendTrace(backend, "record"), false);
  assertDeepEqual(toArray(getBackendTrackIterator(backend)), ["record"]);
  assertEqual(
    sendBackend(backend, {
      type: "stop",
      track: "record",
      status: 0,
    }),
    undefined,
  );
  assertDeepEqual(toArray(getBackendTraceIterator(backend)), ["record"]);
  assertEqual(hasBackendTrack(backend, "record"), false);
  assertDeepEqual(takeBackendTrace(backend, "record"), {
    head: configuration,
    body: [
      {
        type: "source",
        url: "file:///cwd/main.js",
        content: "function main () {}",
        shallow: false,
        inline: false,
        exclude: [],
      },
      {
        type: "start",
        track: "record",
        configuration: { name: "name2" },
        url: null,
      },
      {
        type: "error",
        name: "name",
        message: "message",
        stack: "stack",
      },
      {
        type: "stop",
        track: "record",
        status: 0,
      },
    ],
  });
}
