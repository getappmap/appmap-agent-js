import { assert } from "../../util/index.mjs";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { spawnAsync } from "./spawn.mjs";

/* c8 ignore start */
const isNotEmptyString = (any) => any !== "";
/* c8 ignore stop */

const rankWin32Exec = (exec) => {
  if (exec.endsWith(".exe")) {
    return 2;
  } else if (exec.endsWith(".cmd")) {
    return 1;
  } else {
    return 0;
  }
};

const compareWin32Exec = (exec1, exec2) =>
  rankWin32Exec(exec2) - rankWin32Exec(exec1);

export const pickWin32Exec = (execs) => {
  assert(
    execs.length > 0,
    "where succeed and returned an empty executable array",
    InternalAppmapError,
  );
  execs = execs.slice();
  execs.sort(compareWin32Exec);
  return execs[0];
};

/* c8 ignore start */
export const whereAsync = async (exec, children) => {
  const { status, signal, stdout, stderr } = await spawnAsync(
    {
      exec: "where.exe",
      argv: [exec],
      options: {
        stdio: "pipe",
        encoding: "utf8",
      },
    },
    children,
  );
  assert(
    !logErrorWhen(
      status !== 0 || signal !== null,
      "Could not locate executable %j: %j >> %s",
      exec,
      { status, signal },
      stderr,
    ),
    "Could not locate executable",
    ExternalAppmapError,
  );
  return pickWin32Exec(stdout.split("\r\n").filter(isNotEmptyString));
};
/* c8 ignore stop */
