const { URL, parseInt } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
const { expect, expectSuccess } = await import(
  `../../expect/index.mjs${__search}`
);
const { logWarning } = await import(`../../log/index.mjs${__search}`);
const { mapMaybe, coalesce } = await import(`../../util/index.mjs${__search}`);

const trim = (string) => string.trim();

const run = (command, url) => {
  const result = spawnSync(command.split(" ")[0], command.split(" ").slice(1), {
    cwd: fileURLToPath(url),
    encoding: "utf8",
    timeout: 1000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const error = coalesce(result, "error", null);
  expect(
    error === null,
    `command %j on cwd %j threw an error >> %O`,
    command,
    url,
    error || { message: "dummy" },
  );
  const { signal, status, stdout, stderr } = result;
  expect(
    signal === null,
    `command %j on cwd %j was killed with %j`,
    command,
    url,
    signal,
  );
  if (status === 0) {
    return stdout.trim();
  }
  /* c8 ignore start */
  logWarning(
    `command %j on cwd %j failed with %j >> %s`,
    command,
    url,
    status,
    stderr,
  );
  return null;
  /* c8 ignore stop */
};

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

export const extractGitInformation = (url) => {
  if (
    !expectSuccess(
      () => readdirSync(new URL(url)),
      "could not read repository directory %j >> %O",
      url,
    ).includes(".git")
  ) {
    logWarning("Repository directory %j is not a git directory", url);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, url),
    branch: run(`git rev-parse --abbrev-ref HEAD`, url),
    commit: run(`git rev-parse HEAD`, url),
    status: mapMaybe(run(`git status --porcelain`, url), parseStatus),
    tag: run(`git describe --abbrev=0 --tags`, url),
    annotated_tag: run(`git describe --abbrev=0`, url),
    commits_since_tag: mapMaybe(
      run(`git describe --long --tags`, url),
      parseDescription,
    ),
    commits_since_annotated_tag: mapMaybe(
      run(`git describe --long`, url),
      parseDescription,
    ),
  };
};
