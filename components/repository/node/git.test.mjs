import { mkdir } from "fs/promises";
import { execSync } from "child_process";
import {
  assertEqual,
  assertThrow,
  getFreshTemporaryPath,
} from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Git from "./git.mjs";

const { isArray } = Array;

const { extractGitInformation } = Git(
  await buildTestDependenciesAsync(import.meta.url),
);

const url = "https://github.com/lachrist/sample.git";
const path = getFreshTemporaryPath();

assertThrow(() => extractGitInformation(path), /^AppmapError:.*ENOENT/);
await mkdir(path);
assertEqual(extractGitInformation(path), null);
execSync(`git clone ${url} ${path}`, {
  stdio: "ignore",
});

{
  const infos = extractGitInformation(path);
  assertEqual(infos.repository, url);
  assertEqual(infos.branch, "main");
  assertEqual(typeof infos.commit, "string");
  assertEqual(isArray(infos.status), true);
  assertEqual(typeof infos.annotated_tag, "string");
  assertEqual(typeof infos.tag, "string");
  assertEqual(typeof infos.commits_since_annotated_tag, "number");
  assertEqual(typeof infos.commits_since_tag, "number");
}
