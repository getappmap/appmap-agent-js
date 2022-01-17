import { readFile as readFileAsync } from "fs/promises";
import { platform as getPlatform } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { spawnStrictAsync } from "../../spawn.mjs";
import { runAsync } from "./__fixture__.mjs";

const { equal: assertEqual } = Assert;

await runAsync(
  null,
  {
    command: "npx bin-sample",
    pruning: false,
    output: {
      basename: "basename",
    },
    processes: { regexp: "^../", enabled: false },
    packages: { dist: "bin-sample", recursive: true },
    recorder: "process",
    hooks: { esm: false, cjs: true, apply: false, http: false },
  },
  async (repository) => {
    await spawnStrictAsync(
      getPlatform() === "win32" ? "npm.cmd" : "npm",
      ["install", "bin-sample@0.0.0"],
      { cwd: repository, stdio: "inherit" },
    );
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "basename.appmap.json"),
        "utf8",
      ),
    );
    assertEqual(appmap.classMap.length, 1);
  },
);
