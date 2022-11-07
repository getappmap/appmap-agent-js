const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { spawnSync as spawnChildProcess } from "child_process";
const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);

const { logWarning, logErrorWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { coalesce, assert } = await import(`../../util/index.mjs${__search}`);

const { convertFileUrlToPath } = await import(
  `../../path/index.mjs${__search}`
);

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
