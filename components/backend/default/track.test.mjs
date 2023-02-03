import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { startTrack, stopTrack, compileTrack, sendTrack } from "./track.mjs";

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
