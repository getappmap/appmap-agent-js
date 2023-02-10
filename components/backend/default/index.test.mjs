import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createBackend,
  compileBackendTrack,
  compileBackendTrackArray,
  hasBackendTrack,
  sendBackend,
  isBackendSessionEmpty,
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

assertDeepEqual(compileBackendTrack(backend, "session", "track", true), {
  url: "protocol://host/base/dirname/process/basename.appmap.json",
  content: {
    messages: [message2],
    configuration,
  },
});

assertEqual(hasBackendTrack(backend, "session", "track"), false);

assertEqual(sendBackend(backend, "session", message1), true);

assertEqual(sendBackend(backend, "session", message2), true);

assertEqual(isBackendSessionEmpty(backend, "session"), false);

assertDeepEqual(compileBackendTrackArray(backend, "session", true), [
  {
    url: "protocol://host/base/dirname/process/basename-1.appmap.json",
    content: {
      configuration,
      messages: [message2],
    },
  },
]);

assertEqual(isBackendSessionEmpty(backend, "session"), true);

assertEqual(sendBackend(backend, "session", { type: "close" }), true);

/////////////////////
// missing session //
/////////////////////

assertEqual(isBackendSessionEmpty(backend, "session"), null);

assertEqual(hasBackendTrack(backend, "session", "track"), null);

assertEqual(compileBackendTrackArray(backend, "session", true), null);

assertEqual(compileBackendTrack(backend, "session", "record", true), null);

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

assertEqual(compileBackendTrack(backend, "session", "record", true), null);

assertEqual(sendBackend(backend, "session", { type: "close" }), true);
