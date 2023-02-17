import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node.mjs";

const { name, recursive, doesSupport, hookCommandAsync, hookEnvironment } =
  generateNodeRecorder("process");

const base = "file:///A:/base/";
const recorder_url = "file:///A:/base/lib/node/recorder.mjs";

assertEqual(name, "process");
assertEqual(recursive, false);

assertEqual(doesSupport(["node.ext", "main.mjs"]), true);
assertDeepEqual(await hookCommandAsync(["node.ext", "main.mjs"], base), [
  "node.ext",
  "--experimental-loader",
  recorder_url,
  "main.mjs",
]);

assertDeepEqual(hookEnvironment({ FOO: "bar" }, base), { FOO: "bar" });
