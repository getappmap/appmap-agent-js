const { parseInt, URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { readdirSync as readdir } from "node:fs";

import { ExternalAppmapError } from "../../error/index.mjs";
import { mapMaybe } from "../../util/index.mjs";
import { logError, logWarning } from "../../log/index.mjs";
import { spawn } from "./spawn.mjs";

const trim = (string) => string.trim();

const parseStatus = (stdout) => stdout.split("\n").map(trim);

const parseDescription = (stdout) => {
  const parts = /^([^-]*)-([0-9]+)-/u.exec(stdout);
  /* c8 ignore start */
  if (parts === null) {
    logWarning("Failed to parse git description %j", stdout);
    return 0;
  }
  /* c8 ignore stop */
  return parseInt(parts[2], 10);
};

const readRepository = (url) => {
  try {
    return readdir(new URL(url));
  } catch (error) {
    logError("Could not read repository directory %j >> %O", url, error);
    throw new ExternalAppmapError("Could not read repository directory");
  }
};

export const extractRepositoryHistory = (url) => {
  if (readRepository(url).includes(".git")) {
    return {
      repository: spawn("git", ["config", "--get", "remote.origin.url"], url),
      branch: spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"], url),
      commit: spawn("git", ["rev-parse", "HEAD"], url),
      status: mapMaybe(
        spawn("git", ["status", "--porcelain"], url),
        parseStatus,
      ),
      tag: spawn("git", ["describe", "--abbrev=0", "--tags"], url),
      annotated_tag: spawn("git", ["describe", "--abbrev=0"], url),
      commits_since_tag: mapMaybe(
        spawn("git", ["describe", "--long", "--tags"], url),
        parseDescription,
      ),
      commits_since_annotated_tag: mapMaybe(
        spawn("git", ["describe", "--long"], url),
        parseDescription,
      ),
    };
  } else {
    logWarning("Repository directory %j is not a git directory", url);
    return null;
  }
};
