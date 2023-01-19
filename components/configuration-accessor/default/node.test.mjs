import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node.mjs";

const {
  name,
  recursive,
  doesSupportSource,
  doesSupportTokens,
  hookCommandSourceAsync,
  hookCommandTokensAsync,
  hookEnvironment,
} = generateNodeRecorder("process");

const base = "file:///A:/base/";
const recorder_url = "file:///A:/base/lib/node/recorder.mjs";

assertEqual(name, "process");
assertEqual(recursive, false);

assertEqual(doesSupportSource("node.ext main.mjs"), true);
assertDeepEqual(
  await hookCommandSourceAsync("node.ext main.mjs", "/bin/sh", base),
  [`node.ext --experimental-loader ${recorder_url} main.mjs`],
);

assertEqual(doesSupportTokens(["node.ext", "main.mjs"]), true);
assertDeepEqual(await hookCommandTokensAsync(["node.ext", "main.mjs"], base), [
  "node.ext",
  "--experimental-loader",
  recorder_url,
  "main.mjs",
]);

assertDeepEqual(hookEnvironment({ FOO: "bar" }, base), { FOO: "bar" });
