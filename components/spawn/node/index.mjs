import { platform } from "node:process";
import { hasOwnProperty } from "../../util/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { whereAsync } from "./where.mjs";
import { spawnAsync as spawnAsyncInner } from "./spawn.mjs";
export { killAllAsync } from "./spawn.mjs";

export const spawnAsync = async (command, children) => {
  try {
    return await spawnAsyncInner(command, children);
  } catch (error) {
    /* c8 ignore start */ if (
      hasOwnProperty(error, "code") &&
      error.code === "ENOENT" &&
      platform === "win32"
    ) {
      logWarning(
        "Could not find executable %j, we will try to locate it using `where.exe`. Often, this is caused by a missing extension on Windows. For instance `npx jest` should be `npx.cmd jest`. Note that it is possible to provide a windows-specific command with `command-win32`.",
        command.exec,
      );
      return await spawnAsyncInner(
        {
          ...command,
          exec: await whereAsync(command.exec, children),
        },
        children,
      );
    } /* c8 ignore stop */ else {
      throw error;
    }
  }
};
