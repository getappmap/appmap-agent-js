import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createBackend,
  sendBackend,
  hasBackendTrack,
  compileBackendTrack,
  compileBackendAvailableTrack,
  isBackendEmpty,
} from "./index.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    validate: {
      message: true,
    },
    recorder: "process",
    appmap_dir: "dirname",
    appmap_file: "basename",
  },
  "protocol://host/base/",
);

// stop one && standard message //
{
  const backend = createBackend(configuration);
  assertEqual(hasBackendTrack(backend, "record"), false);
  const message1 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendBackend(backend, message1), true);
  assertEqual(sendBackend(backend, message1), false); // duplicate track
  assertEqual(hasBackendTrack(backend, "record"), true);
  const message2 = {
    type: "error",
    session: "session",
    error: {
      type: "number",
      print: "123",
    },
  };
  assertEqual(sendBackend(backend, message2), true);
  assertDeepEqual(compileBackendTrack(backend, "record", false), null);
  const message3 = {
    type: "stop",
    track: "record",
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendBackend(backend, message3), true);
  assertEqual(isBackendEmpty(backend), false);
  assertDeepEqual(compileBackendTrack(backend, "record", true), {
    url: "protocol://host/base/dirname/process/basename.appmap.json",
    content: {
      configuration,
      messages: [message2],
      termination: { type: "manual" },
    },
  });
  assertEqual(isBackendEmpty(backend), true);
  assertEqual(compileBackendTrack(backend, "record", true), null); // missing track
  assertEqual(sendBackend(backend, message3), false); // missing track
}

// stop all && source message //
{
  const backend = createBackend(configuration);
  const message1 = {
    type: "source",
    url: "protocol://host/before-start.js",
    content: "function beforeStart () {}",
  };
  assertEqual(sendBackend(backend, message1), true);
  const message2 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendBackend(backend, message2), true);
  const message3 = {
    type: "source",
    url: "protocol://host/after-start.js",
    content: "function afterStart () {}",
  };
  assertEqual(sendBackend(backend, message3), true);
  const message4 = {
    type: "stop",
    track: null,
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendBackend(backend, message4), true),
    assertDeepEqual(compileBackendAvailableTrack(backend, false), {
      url: "protocol://host/base/dirname/process/basename.appmap.json",
      content: {
        configuration,
        messages: [message1, message3],
        termination: { type: "manual" },
      },
    });
  assertEqual(compileBackendAvailableTrack(backend, false), null);
}
