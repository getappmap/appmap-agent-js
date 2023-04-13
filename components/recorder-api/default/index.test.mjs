import {
  assertEqual,
  assertDeepEqual,
  assertThrow,
} from "../../__fixture__.mjs";
import { Appmap } from "./index.mjs";

const appmap = new Appmap(
  "protocol://host/home/",
  {
    name: "name1",
    recorder: "manual",
    packages: ["*"],
    hooks: {
      cjs: false,
      esm: false,
      eval: false,
      apply: false,
      http: false,
      mysql: false,
      pg: false,
      sqlite3: false,
    },
  },
  "protocol://host/base/",
);

assertEqual(
  typeof appmap.instrumentModule("123;", "protocol://host/base/main.js"),
  "string",
);

const track = appmap.startRecording(null, { name: "name2" }, null);
assertThrow(
  () => appmap.recordScript("123;", "INVALID URL"),
  /^ExternalAppmapError: Invalid url argument$/u,
);
assertEqual(appmap.recordScript("123;", "protocol://host/base/main.js"), 123);
assertDeepEqual(appmap.stopRecording(track).messages, [
  {
    type: "source",
    url: "protocol://host/base/main.js",
    content: "123;",
  },
  {
    type: "source",
    url: "protocol://host/base/main.js",
    content: "123;",
  },
]);
appmap.terminate();
