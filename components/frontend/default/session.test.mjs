import { strict as Assert } from "assert";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Session from "./session.mjs";

const { deepEqual: assertDeepEqual } = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const {
  createSession,
  initializeSession,
  startTrackSession,
  registerFileSession,
  recordEventSession,
  stopTrackSession,
  terminateSession,
} = Session(dependencies);
const configuration = createConfiguration("/");
const session = createSession(configuration);
assertDeepEqual(initializeSession(session), ["initialize", configuration]);
assertDeepEqual(startTrackSession(session, "track", {}), [
  "start",
  "track",
  {},
]);
assertDeepEqual(registerFileSession(session, "file"), ["file", "file"]);
assertDeepEqual(
  recordEventSession(session, "begin", "index", "time", "bundle", "data"),
  ["event", "begin", "index", "time", "bundle", "data"],
);
assertDeepEqual(stopTrackSession(session, "track", { errors: [], status: 0 }), [
  "stop",
  "track",
  { errors: [], status: 0 },
]);
{
  const message = terminateSession(session, {
    errors: [new TypeError("BOUM")],
    status: 0,
  });
  delete message[1].errors[0].stack;
  assertDeepEqual(message, [
    "terminate",
    { errors: [{ name: "TypeError", message: "BOUM" }], status: 0 },
  ]);
}
assertDeepEqual(startTrackSession(session, "track", {}), null);
