import { spawnSync } from "child_process";
import { readdirSync } from "fs";

const _parseInt = parseInt;

export default (dependencies) => {
  const {
    expect: { expect, expectSuccess },
    log: { logWarning },
    util: { mapMaybe, coalesce },
  } = dependencies;

  const trim = (string) => string.trim();

  const run = (command, path) => {
    const result = spawnSync(
      command.split(" ")[0],
      command.split(" ").slice(1),
      {
        cwd: path,
        encoding: "utf8",
        timeout: 1000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const error = coalesce(result, "error", null);
    expect(
      error === null,
      `command %j on cwd %j threw an error >> %e`,
      command,
      path,
      error || { message: "dummy" },
    );
    const { signal, status, stdout, stderr } = result;
    expect(
      signal === null,
      `command %j on cwd %j was killed with %j`,
      command,
      path,
      signal,
    );
    if (status === 0) {
      return stdout.trim();
    }
    /* c8 ignore start */
    logWarning(
      `command %j on cwd %j failed with %j >> %s`,
      command,
      path,
      status,
      stderr,
    );
    return null;
    /* c8 ignore stop */
  };

  const parseStatus = (stdout) => stdout.split("\n").map(trim);

  const parseDescription = (stdout) => {
    const parts = /^([^-]*)-([0-9]+)-/u.exec(stdout);
    expect(parts !== null, `failed to parse git description >> %s`, stdout);
    return _parseInt(parts[2], 10);
  };

  return {
    extractGitInformation: (directory) => {
      if (
        !expectSuccess(
          () => readdirSync(directory),
          "could not read repository directory %j >> %e",
          directory,
        ).includes(".git")
      ) {
        logWarning("Repository directory %j is not a git directory", directory);
        return null;
      }
      return {
        repository: run(`git config --get remote.origin.url`, directory),
        branch: run(`git rev-parse --abbrev-ref HEAD`, directory),
        commit: run(`git rev-parse HEAD`, directory),
        status: mapMaybe(run(`git status --porcelain`, directory), parseStatus),
        tag: run(`git describe --abbrev=0 --tags`, directory),
        annotated_tag: run(`git describe --abbrev=0`, directory),
        commits_since_tag: mapMaybe(
          run(`git describe --long --tags`, directory),
          parseDescription,
        ),
        commits_since_annotated_tag: mapMaybe(
          run(`git describe --long`, directory),
          parseDescription,
        ),
      };
    },
  };
};
