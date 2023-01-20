import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node-recursive.mjs";

const { name, recursive, doesSupport, hookCommandAsync, hookEnvironment } =
  generateNodeRecorder("process");

const base = "file:///A:/base/";
const recorder_url = "file:///A:/base/lib/node/recorder.mjs";

assertEqual(name, "process");

assertEqual(recursive, true);

assertEqual(doesSupport(["token"]), true);

assertDeepEqual(await hookCommandAsync(["token"], base), ["token"]);

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${recorder_url}`,
  },
);
