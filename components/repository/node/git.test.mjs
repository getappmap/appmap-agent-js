import { mkdir as mkdirAsync } from "fs/promises";
import { execSync } from "child_process";
import { assertEqual, assertThrow } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { extractGitInformation } from "./git.mjs";

const {
  URL,
  Array: { isArray },
} = globalThis;

const origin_url = "https://github.com/lachrist/sample.git";
const url = toAbsoluteUrl(getUuid(), getTmpUrl());

assertThrow(
  () => extractGitInformation(url),
  /^ExternalAppmapError: Could not read repository directory$/u,
);
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
