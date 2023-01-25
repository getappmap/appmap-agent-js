import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createSession,
  sendSession,
  hasSessionTrack,
  compileSessionTrace,
  compileSessionTraceArray,
} from "./session.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    recorder: "process",
    appmap_dir: "dirname",
    appmap_file: "basename",
  },
  "protocol://host/base/",
);

// stop one && standard message //
{
  const session = createSession(configuration);
  assertEqual(hasSessionTrack(session, "record"), false);
  const message1 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendSession(session, message1), true);
  // duplicate track
  assertEqual(sendSession(session, message1), false);
  assertEqual(hasSessionTrack(session, "record"), true);
  const message2 = {
    type: "error",
    error: {
      type: "number",
      print: "123",
    },
  };
  assertEqual(sendSession(session, message2), true);
  const message3 = {
    type: "stop",
    track: "record",
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendSession(session, message3), true);
  // missing track
  assertEqual(sendSession(session, message3), false);
  // duplicate trace
  assertEqual(sendSession(session, message1), true);
  assertEqual(sendSession(session, message3), false);
  assertDeepEqual(compileSessionTrace(session, "record"), {
    url: "protocol://host/base/dirname/process/basename.appmap.json",
    content: [message1, message2, message3],
  });
  // missing trace
  assertEqual(compileSessionTrace(session, "record"), null);
}

// stop all && source message //
{
  const session = createSession(configuration);
  const message1 = {
    type: "source",
    url: "protocol://host/cwd/main.js",
    content: "function main () {}",
    shallow: false,
    inline: false,
    exclude: [],
  };
  assertEqual(sendSession(session, message1), true);
  const message2 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendSession(session, message2), true);
  const message3 = {
    type: "stop",
    track: null,
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendSession(session, message3), true),
    assertDeepEqual(compileSessionTraceArray(session), [
      {
        url: "protocol://host/base/dirname/process/basename.appmap.json",
        content: [message1, message2, message3],
      },
    ]);
  assertDeepEqual(compileSessionTraceArray(session), []);
}
