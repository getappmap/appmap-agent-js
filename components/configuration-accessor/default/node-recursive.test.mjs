import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { generateNodeRecorder } from "./node-recursive.mjs";

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

assertEqual(recursive, true);

assertEqual(doesSupportSource("source"), true);

assertDeepEqual(await hookCommandSourceAsync("source", "/bin/sh", base), [
  "source",
]);

assertEqual(doesSupportTokens(["token"]), true);

assertDeepEqual(await hookCommandTokensAsync(["token"], base), ["token"]);

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-loader=${recorder_url}`,
  },
);
