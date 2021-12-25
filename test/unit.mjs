import { lstat as lstatAsync, readdir as readdirAsync } from "fs/promises";
import { join as joinPath } from "path";
import { spawnAsync } from "./spawn.mjs";

const { stdout } = process;

const loop = async (path) => {
  if (path.endsWith(".test.mjs")) {
    stdout.write(`${path}...${"\n"}`);
    const { signal, status } = await spawnAsync("node", [
      "--unhandled-rejections=strict",
      path,
    ]);
    if (signal !== null) {
      throw new Error(`Killed by ${signal}`);
    }
    if (status !== 0) {
      throw new Error(`Exit code ${String(status)}`);
    }
  } else if ((await lstatAsync(path)).isDirectory()) {
    for (const filename of await readdirAsync(path)) {
      await loop(joinPath(path, filename));
    }
  }
};

await loop("./build");
await loop("./components.mjs");
