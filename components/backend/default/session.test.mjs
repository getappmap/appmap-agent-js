import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createSession,
  sendSession,
  hasSessionTrack,
  compileSessionTrack,
  compileSessionTrackArray,
  isSessionEmpty,
} from "./session.mjs";

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
  const session = createSession(configuration);
  assertEqual(hasSessionTrack(session, "record"), false);
  const message1 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendSession(session, message1), true);
  assertEqual(sendSession(session, message1), false); // duplicate track
  assertEqual(hasSessionTrack(session, "record"), true);
  const message2 = {
    type: "error",
    error: {
      type: "number",
      print: "123",
    },
  };
  assertEqual(sendSession(session, message2), true);
  assertDeepEqual(compileSessionTrack(session, "record", false), null);
  const message3 = {
    type: "stop",
    track: "record",
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendSession(session, message3), true);
  assertEqual(isSessionEmpty(session), false);
  assertDeepEqual(compileSessionTrack(session, "record", true), {
    url: "protocol://host/base/dirname/process/basename.appmap.json",
    content: {
      configuration,
      messages: [message2],
      termination: { type: "manual" },
    },
  });
  assertEqual(isSessionEmpty(session), true);
  assertEqual(compileSessionTrack(session, "record", true), null); // missing track
  assertEqual(sendSession(session, message3), false); // missing track
}

// stop all && source message //
{
  const session = createSession(configuration);
  const message1 = {
    type: "source",
    url: "protocol://host/before-start.js",
    content: "function beforeStart () {}",
  };
  assertEqual(sendSession(session, message1), true);
  const message2 = {
    type: "start",
    track: "record",
    configuration,
  };
  assertEqual(sendSession(session, message2), true);
  const message3 = {
    type: "source",
    url: "protocol://host/after-start.js",
    content: "function afterStart () {}",
  };
  assertEqual(sendSession(session, message3), true);
  const message4 = {
    type: "stop",
    track: null,
    termination: {
      type: "manual",
    },
  };
  assertEqual(sendSession(session, message4), true),
    assertDeepEqual(compileSessionTrackArray(session, true), [
      {
        url: "protocol://host/base/dirname/process/basename.appmap.json",
        content: {
          configuration,
          messages: [message1, message3],
          termination: { type: "manual" },
        },
      },
    ]);
  assertDeepEqual(compileSessionTrackArray(session, true), []);
}
