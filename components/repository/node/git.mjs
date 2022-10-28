const { URL, parseInt } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawnSync } from "child_process";
import { readdirSync as readdir } from "fs";
const { convertFileUrlToPath } = await import(
  `../../path/index.mjs${__search}`
);
const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);

const { logWarning, logError, logErrorWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { mapMaybe, coalesce, assert } = await import(
  `../../util/index.mjs${__search}`
);

const trim = (string) => string.trim();

const run = (command, url) => {
  const result = spawnSync(command.split(" ")[0], command.split(" ").slice(1), {
    cwd: convertFileUrlToPath(url),
    encoding: "utf8",
    timeout: 1000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const error = coalesce(result, "error", null);
  assert(
    !logErrorWhen(
      error !== null,
      "Command %j on cwd %j threw an error >> %O",
      command,
      url,
      error,
    ),
    "Failed to execute command",
    ExternalAppmapError,
  );
  const { signal, status, stdout, stderr } = result;
  assert(
    !logErrorWhen(
      signal !== null,
      "Command %j on cwd %j was killed with %j",
      command,
      url,
      signal,
    ),
    "Command exit with unexpected kill signal",
    ExternalAppmapError,
  );
  /* c8 ignore start */
  if (status === 0) {
    return stdout.trim();
  } else {
    logWarning(
      `command %j on cwd %j failed with %j >> %s`,
      command,
      url,
      status,
      stderr,
    );
    return null;
  }
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

const readdirFeedback = (url) => {
  try {
    return readdir(new URL(url));
  } catch (error) {
    logError("Could not read repository directory %j >> %O", url, error);
    throw new ExternalAppmapError("Could not read repository directory");
  }
};

export const extractGitInformation = (url) => {
  if (readdirFeedback(url).includes(".git")) {
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
  } else {
    logWarning("Repository directory %j is not a git directory", url);
    return null;
  }
};
