import { spawnSync } from "child_process";

const _parseInt = parseInt;

export default (dependencies) => {
  const {
    assert: { assert },
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
    assert(
      error === null,
      `command %j on cwd %j threw an error >> %e`,
      command,
      path,
      error || { message: "dummy" },
    );
    const { signal, status, stdout, stderr } = result;
    assert(
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
    assert(parts !== null, `failed to parse git description >> %s`, stdout);
    return _parseInt(parts[2], 10);
  };

  return {
    extractGitInformation: (path) => ({
      repository: run(`git config --get remote.origin.url`, path),
      branch: run(`git rev-parse --abbrev-ref HEAD`, path),
      commit: run(`git rev-parse HEAD`, path),
      status: mapMaybe(run(`git status --porcelain`, path), parseStatus),
      tag: run(`git describe --abbrev=0 --tags`, path),
      annotated_tag: run(`git describe --abbrev=0`, path),
      commits_since_tag: mapMaybe(
        run(`git describe --long --tags`, path),
        parseDescription,
      ),
      commits_since_annotated_tag: mapMaybe(
        run(`git describe --long`, path),
        parseDescription,
      ),
    }),
  };
};
