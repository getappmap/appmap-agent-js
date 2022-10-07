import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import { Appmap } from "./index.mjs?env=test";

const { undefined } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("file:///home"),
  {
    name: "name1",
    recorder: "manual",
    packages: ["*"],
    hooks: { cjs: false, esm: false, apply: false, http: false },
  },
  "file:///base",
);

const appmap = new Appmap(configuration);
assertEqual(
  typeof appmap.instrumentModule("123;", "file:///base/main.js"),
  "string",
);

const track = appmap.startRecording(null, { name: "name2" }, null);
assertEqual(appmap.recordScript("123;", "file:///base/main.js"), 123);
assertEqual(appmap.recordError("name", "message", "stack"), undefined);
assertDeepEqual(appmap.stopRecording(track, 123), [
  {
    type: "source",
    url: "file:///base/main.js",
    content: "123;",
    exclude: createConfiguration("file:///home").exclude,
    shallow: false,
    inline: false,
  },
  {
    type: "start",
    track: "uuid",
    configuration: { name: "name2" },
    url: null,
  },
  {
    type: "error",
    name: "name",
    message: "message",
    stack: "stack",
  },
  {
    type: "stop",
    track: "uuid",
    status: 123,
  },
]);
appmap.terminate();
