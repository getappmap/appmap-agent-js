import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import { self_directory } from "../../self/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { doesSupport, hookCommandAsync, hookEnvironment } from "./jest.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const base = "file:///A:/base/";
const recorder_path = convertFileUrlToPath(
  "file:///A:/base/lib/node/recorder.mjs",
);
const transformer_path = convertFileUrlToPath(
  toAbsoluteUrl("lib/node/transformer-jest.mjs", self_directory),
);
const loader_url = "file:///A:/base/lib/node/loader-esm.mjs";

//////////////////
// mocha --argv //
//////////////////

assertEqual(doesSupport(["jest", "--argv"]), true);

assertDeepEqual(await hookCommandAsync(["jest", "--argv"], base), [
  "jest",
  "--argv",
  "--transform",
  stringifyJSON({
    "^": [
      transformer_path,
      {
        "\\.[jt]sx?$": { specifier: "babel-jest", options: {} },
      },
    ],
  }),
  "--setupFilesAfterEnv",
  recorder_path,
]);

/////////////////////
// hookEnvironment //
/////////////////////

assertDeepEqual(
  hookEnvironment({ FOO: "bar", NODE_OPTIONS: "options" }, base),
  {
    FOO: "bar",
    NODE_OPTIONS: `options --experimental-vm-modules --experimental-loader=${loader_url}`,
  },
);
