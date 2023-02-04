import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { hashFile } from "../../hash/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  startTrack,
  stopTrack,
  compileTrack,
  sendTrack,
  isTrackComplete,
} from "./track.mjs";

{
  const track = startTrack();
  const configuration = extendConfiguration(
    createConfiguration("protocol://host/home/"),
    {
      recorder: "process",
      appmap_dir: "appmap_dir",
      appmap_file: "appmap_file",
    },
    "protocol://host/base/",
  );
  const message1 = {
    type: "start",
    track: "track",
    configuration,
  };
  sendTrack(track, message1);
  stopTrack(track);
  const message2 = {
    type: "source",
    url: "protocol://host/path",
    content: "content",
  };
  sendTrack(track, message2);
  const message3 = { type: "error", error: { type: "number", print: "123" } };
  sendTrack(track, message3);
  assertDeepEqual(compileTrack(track), {
    url: "protocol://host/base/appmap_dir/process/appmap_file.appmap.json",
    content: [message1, message2],
  });
}

{
  const source_message = {
    type: "source",
    url: "protocol://host/path",
    content: "content",
  };
  const return_event_message = {
    type: "event",
    site: "end",
    group: 0,
    time: 0,
    tab: 0,
    payload: {
      type: "return",
      function: stringifyLocation({
        hash: hashFile(source_message),
        url: null,
        line: 0,
        column: 0,
      }),
      error: { type: "number", print: "0" },
    },
  };
  const throw_event_message = {
    type: "event",
    site: "end",
    group: 0,
    time: 0,
    tab: 0,
    payload: {
      type: "throw",
      function: stringifyLocation({
        hash: null,
        url: source_message.url,
        line: 0,
        column: 0,
      }),
      result: { type: "number", print: "0" },
    },
  };
  // first location then source //
  {
    const track = startTrack();
    sendTrack(track, source_message);
    sendTrack(track, return_event_message);
    sendTrack(track, throw_event_message);
    assertEqual(isTrackComplete(track), false);
    stopTrack(track);
    assertEqual(isTrackComplete(track), true);
  }
  // first source then location //
  {
    const track = startTrack();
    sendTrack(track, return_event_message);
    sendTrack(track, throw_event_message);
    stopTrack(track);
    assertEqual(isTrackComplete(track), false);
    sendTrack(track, source_message);
    assertEqual(isTrackComplete(track), true);
  }
}
