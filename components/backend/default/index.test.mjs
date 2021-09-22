import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Backend from "./index.mjs";

Error.stackTraceLimit = Infinity;

const {
  equal: assertEqual,
  deepEqual: assertDeepEqual,
  // throws: assertThrows
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync(
  "configuration",
  "test",
);

const {
  createBackend,
  openBackendSession,
  sendBackend,
  closeBackendSession,
  respondBackend,
} = Backend(dependencies);

// Storage //
{
  const initialization = {
    path: null,
    options: { output: { basename: "basename" } },
  };
  const termination = { errors: [], status: 0 };
  const backend = createBackend();
  openBackendSession(backend, "session");
  assertDeepEqual(
    [
      ...sendBackend(backend, "session", [
        "initialize",
        createConfiguration("/cwd"),
      ]),
      ...sendBackend(backend, "session", ["start", "track1", initialization]),
      ...sendBackend(backend, "session", ["start", "track2", initialization]),
      ...sendBackend(backend, "session", ["stop", "track2", termination]),
      ...sendBackend(backend, "session", ["stop", "track1", termination]),
      ...closeBackendSession(backend, "session"),
    ].map(({ path }) => path),
    [
      "/cwd/tmp/appmap/basename.appmap.json",
      "/cwd/tmp/appmap/basename-1.appmap.json",
    ],
  );
}

// Respond //
{
  const getCode = ({ code }) => code;

  const backend = createBackend();

  assertEqual(getCode(respondBackend(backend, "POST", "")), 400);

  assertEqual(getCode(respondBackend(backend, "POST", "/_appmap/track")), 404);

  openBackendSession(backend, "session1");
  sendBackend(backend, "session1", ["initialize", createConfiguration("/cwd")]);
  assertEqual(getCode(respondBackend(backend, "POST", "/_appmap/track1")), 200);

  // Multiple Session //
  openBackendSession(backend, "session2");
  assertEqual(getCode(respondBackend(backend, "POST", "/_appmap/track")), 409);
  closeBackendSession(backend, "session2");

  assertEqual(
    getCode(respondBackend(backend, "DELETE", "/session3/track")),
    404,
  );
  closeBackendSession(backend, "session1");
  assertEqual(
    getCode(respondBackend(backend, "DELETE", "/session1/track1")),
    200,
  );
}
