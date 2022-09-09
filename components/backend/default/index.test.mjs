import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Backend from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration, extendConfiguration } =
  await buildTestComponentAsync("configuration", "test");
const {
  createBackend,
  sendBackend,
  getBackendTrackIterator,
  getBackendTraceIterator,
  hasBackendTrace,
  hasBackendTrack,
  takeBackendTrace,
} = Backend(dependencies);

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
    false,
  );
  assertEqual(
    sendBackend(backend, {
      type: "start",
      track: "record",
      configuration: { name: "name2" },
      url: null,
    }),
    false,
  );
  assertEqual(
    sendBackend(backend, {
      type: "error",
      name: "name",
      message: "message",
      stack: "stack",
    }),
    false,
  );
  assertEqual(hasBackendTrace(backend, "record"), false);
  assertDeepEqual(Array.from(getBackendTrackIterator(backend)), ["record"]);
  assertEqual(
    sendBackend(backend, {
      type: "stop",
      track: "record",
      status: 0,
    }),
    true,
  );
  assertDeepEqual(Array.from(getBackendTraceIterator(backend)), ["record"]);
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
