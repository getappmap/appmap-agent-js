import { mkdir as mkdirAsync } from "fs/promises";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  assertEqual,
  assertThrow,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { extractGitInformation } from "./git.mjs?env=test";

const {
  URL,
  Array: { isArray },
} = globalThis;

const origin_url = "https://github.com/lachrist/sample.git";
const url = getFreshTemporaryURL();

assertThrow(() => extractGitInformation(url), /^AppmapError:.*ENOENT/u);
await mkdirAsync(new URL(url));
assertEqual(extractGitInformation(url), null);
execSync(`git clone ${origin_url} .`, {
  cwd: fileURLToPath(url),
  stdio: "ignore",
});

{
  const infos = extractGitInformation(url);
  assertEqual(infos.repository, origin_url);
  assertEqual(infos.branch, "main");
  assertEqual(typeof infos.commit, "string");
  assertEqual(isArray(infos.status), true);
  assertEqual(typeof infos.annotated_tag, "string");
  assertEqual(typeof infos.tag, "string");
  assertEqual(typeof infos.commits_since_annotated_tag, "number");
  assertEqual(typeof infos.commits_since_tag, "number");
}
