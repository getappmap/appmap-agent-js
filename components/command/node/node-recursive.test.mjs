import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node-recursive.mjs";

const { name, recursive, doesSupport, hookCommandAsync, hookEnvironment } =
  generateNodeRecorder("process");

const base = "file:///A:/base/";
const self = "file:///A:/self/";
const recorder_url = "file:///A:/self/lib/node/recorder.mjs";

assertEqual(name, "process");

assertEqual(recursive, true);

assertEqual(doesSupport(["token"]), true);

assertDeepEqual(await hookCommandAsync(["token"], self, base), ["token"]);

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, self, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${recorder_url}`,
  },
);
