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
    sendBackend(backend, [
      "source",
      {
        url: "file:///cwd/main.js",
        content: "function main () {}",
        shallow: false,
        inline: false,
        exclude: [],
      },
    ]),
    false,
  );
  assertEqual(
    sendBackend(backend, [
      "start",
      "record",
      { path: null, data: { name: "name2" } },
    ]),
    false,
  );
  assertEqual(
    sendBackend(backend, ["event", "begin", 123, 0, "bundle", null]),
    false,
  );
  assertEqual(hasBackendTrace(backend, "record"), false);
  assertDeepEqual(Array.from(getBackendTrackIterator(backend)), ["record"]);
  assertEqual(
    sendBackend(backend, ["stop", "record", { status: 0, errors: [] }]),
    true,
  );
  assertDeepEqual(Array.from(getBackendTraceIterator(backend)), ["record"]);
  assertEqual(hasBackendTrack(backend, "record"), false);
  assertDeepEqual(takeBackendTrace(backend, "record"), {
    head: extendConfiguration(configuration, { name: "name2" }, null),
    body: {
      configuration: extendConfiguration(
        configuration,
        { name: "name2" },
        null,
      ),
      sources: [
        {
          url: "file:///cwd/main.js",
          content: "function main () {}",
          shallow: false,
          inline: false,
          exclude: [],
        },
      ],
      events: [
        {
          type: "begin",
          index: 123,
          time: 0,
          data: {
            type: "bundle",
          },
        },
      ],
      termination: {
        status: 0,
        errors: [],
      },
    },
  });
}
