import { spawnSync as spawnChildProcess } from "child_process";
import { ExternalAppmapError } from "../../error/index.mjs";

import { logWarning, logErrorWhen } from "../../log/index.mjs";
import { coalesce, assert } from "../../util/index.mjs";

import { convertFileUrlToPath } from "../../path/index.mjs";

const { URL } = globalThis;

export const spawn = (exec, argv, url) => {
  const result = spawnChildProcess(exec, argv, {
    cwd: convertFileUrlToPath(new URL(".", url)),
    encoding: "utf8",
    timeout: 1000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const error = coalesce(result, "error", null);
  assert(
    !logErrorWhen(
      error !== null,
      "Executable %j with argv %j on cwd %j threw an error >> %O",
      exec,
      argv,
      url,
      error,
    ),
    "Failed to spawn executable",
    ExternalAppmapError,
  );
  const { signal, status, stdout, stderr } = result;
  assert(
    !logErrorWhen(
      signal !== null,
      "Executable %j with argv %j on cwd %j was killed with %j",
      exec,
      argv,
      url,
      signal,
    ),
    "Command exit with unexpected kill signal",
    ExternalAppmapError,
  );
  if (status === 0) {
    return stdout.trim();
  } else {
    logWarning(
      "Executable %j with argv %j on cwd %j failed with %j >> %s",
      exec,
      argv,
      url,
      status,
      stderr,
    );
    return null;
  }
};
