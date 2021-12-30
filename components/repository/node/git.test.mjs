import { mkdir as mkdirAsync } from "fs/promises";
import { execSync } from "child_process";
import {
  assertEqual,
  assertThrow,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Git from "./git.mjs";

const { isArray } = Array;

const { extractGitInformation } = Git(
  await buildTestDependenciesAsync(import.meta.url),
);

const origin_url = "https://github.com/lachrist/sample.git";
const url = getFreshTemporaryURL();

assertThrow(() => extractGitInformation(url), /^AppmapError:.*ENOENT/);
await mkdirAsync(new URL(url));
assertEqual(extractGitInformation(url), null);
execSync(`git clone ${origin_url} .`, {
  cwd: new URL(url),
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
