import { lstat as lstatAsync, readdir as readdirAsync } from "fs/promises";
import { join as joinPath } from "path";
import { spawnAsync } from "../spawn.mjs";

const {
  process: { stdout },
  String,
} = globalThis;

const loop = async (path) => {
  if (path.endsWith(".test.mjs")) {
    stdout.write(`${path}...${"\n"}`);
    const { signal, status } = await spawnAsync("node", [
      "--unhandled-rejections=strict",
      path,
    ]);
    if (signal !== null) {
      stdout.write(`Killed by ${signal}${"\n"}`);
    } else if (status !== 0) {
      stdout.write(`Exit code ${String(status)}${"\n"}`);
    } else {
      stdout.write("Success\n");
    }
  } else if ((await lstatAsync(path)).isDirectory()) {
    for (const filename of await readdirAsync(path)) {
      await loop(joinPath(path, filename));
    }
  }
};

await loop("./build");
await loop("./components");
