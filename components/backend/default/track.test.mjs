import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  getSourceUrl,
  createSource,
  makeSourceLocation,
  toSourceMessage,
} from "../../source/index.mjs";
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
  addTrackSource,
  isTrackComplete,
} from "./track.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    recorder: "process",
    appmap_dir: "appmap_dir",
    appmap_file: "appmap_file",
  },
  "protocol://host/base/",
);

{
  const track = startTrack(configuration);
  stopTrack(track);
  const source = createSource("protocol://host/path", "content");
  addTrackSource(track, source);
  const message2 = { type: "error", error: { type: "number", print: "123" } };
  sendTrack(track, message2);
  assertDeepEqual(compileTrack(track), {
    url: "protocol://host/base/appmap_dir/process/appmap_file.appmap.json",
    content: {
      configuration,
      messages: [toSourceMessage(source)],
      termination: { type: "unknown" },
    },
  });
}

{
  const source = createSource("protocol://host/path", "content");
  const return_event_message = {
    type: "event",
    site: "end",
    group: 0,
    time: 0,
    tab: 0,
    payload: {
      type: "return",
      function: stringifyLocation(makeSourceLocation(source, 0, 0)),
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
        url: getSourceUrl(source),
        line: 0,
        column: 0,
      }),
      result: { type: "number", print: "0" },
    },
  };
  // first location then source //
  {
    const track = startTrack(configuration);
    addTrackSource(track, source);
    sendTrack(track, return_event_message);
    sendTrack(track, throw_event_message);
    assertEqual(isTrackComplete(track), false);
    stopTrack(track, { type: "manual" });
    assertEqual(isTrackComplete(track), true);
  }
  // first source then location //
  {
    const track = startTrack(configuration);
    sendTrack(track, return_event_message);
    sendTrack(track, throw_event_message);
    stopTrack(track, { type: "manual" });
    assertEqual(isTrackComplete(track), false);
    addTrackSource(track, source);
    assertEqual(isTrackComplete(track), true);
  }
}
