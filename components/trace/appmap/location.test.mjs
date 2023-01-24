import { platform } from "node:process";
import { assertEqual } from "../../__fixture__.mjs";
import { getLocationUrl } from "./location.mjs";

assertEqual(
  getLocationUrl({
    recorder: "process",
    appmap_dir: "protocol://host/path/",
    appmap_file: "foo/bar",
    "map-name": null,
  }),
  platform === "win32"
    ? "protocol://host/path/process/foo-bar.appmap.json"
    : "protocol://host/path/process/foo%5Cbar.appmap.json",
);

assertEqual(
  getLocationUrl({
    recorder: "process",
    appmap_dir: "protocol://host/dirname/",
    appmap_file: "basename",
    "map-name": null,
  }),
  "protocol://host/dirname/process/basename.appmap.json",
);

assertEqual(
  getLocationUrl({
    recorder: "process",
    appmap_dir: "protocol://host/dirname/",
    appmap_file: null,
    "map-name": "basename",
  }),
  "protocol://host/dirname/process/basename.appmap.json",
);

assertEqual(
  getLocationUrl({
    recorder: "process",
    appmap_dir: "protocol://host/dirname/",
    appmap_file: null,
    "map-name": null,
  }),
  "protocol://host/dirname/process/anonymous.appmap.json",
);
