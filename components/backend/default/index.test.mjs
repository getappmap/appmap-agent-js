import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createBackend,
  compileBackendTrace,
  compileBackendTraceArray,
  hasBackendTrack,
  sendBackend,
} from "./index.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    recorder: "process",
    appmap_dir: "dirname",
    appmap_file: "basename",
    validate: { message: true },
  },
  "protocol://host/base/",
);

const backend = createBackend(configuration);

const message1 = {
  type: "start",
  track: "track",
  configuration,
};

const message2 = {
  type: "stop",
  track: "track",
  termination: { type: "manual" },
};

////////////////
// happy path //
////////////////

assertEqual(sendBackend(backend, "session", { type: "open" }), true);

assertEqual(hasBackendTrack(backend, "session", "track"), false);

assertEqual(sendBackend(backend, "session", message1), true);

assertEqual(hasBackendTrack(backend, "session", "track"), true);

assertEqual(sendBackend(backend, "session", message2), true);

assertDeepEqual(compileBackendTrace(backend, "session", "track"), {
  url: "protocol://host/base/dirname/process/basename.appmap.json",
  content: [message1, message2],
});

assertEqual(hasBackendTrack(backend, "session", "track"), false);

assertEqual(sendBackend(backend, "session", message1), true);

assertEqual(sendBackend(backend, "session", message2), true);

assertDeepEqual(compileBackendTraceArray(backend, "session"), [
  {
    url: "protocol://host/base/dirname/process/basename-1.appmap.json",
    content: [message1, message2],
  },
]);

assertEqual(sendBackend(backend, "session", { type: "close" }), true);

/////////////////////
// missing session //
/////////////////////

assertEqual(hasBackendTrack(backend, "session", "track"), null);

assertEqual(compileBackendTraceArray(backend, "session"), null);

assertEqual(compileBackendTrace(backend, "session", "record"), null);

assertEqual(sendBackend(backend, "session", message1), false);

///////////////////////
// duplicate session //
///////////////////////

assertEqual(sendBackend(backend, "session", { type: "open" }), true);

assertEqual(sendBackend(backend, "session", { type: "open" }), false);

assertEqual(sendBackend(backend, "session", { type: "close" }), true);

assertEqual(sendBackend(backend, "session", { type: "close" }), false);

///////////////////
// missing track //
///////////////////

assertEqual(sendBackend(backend, "session", { type: "open" }), true);

assertEqual(compileBackendTrace(backend, "session", "record"), null);

assertEqual(sendBackend(backend, "session", { type: "close" }), true);
