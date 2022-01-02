import {
  writeFile as writeFileAsync,
  symlink as symlinkAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { platform as getPlatform } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

// TODO Figure out how to emulate npm-installed bin on windows
getPlatform() === "win32" || await runAsync(
  null,
  {
    command: [getPlatform() === "win32" ? "npx.cmd" : "npx", "--always-spawn", "bin"],
    pruning: false,
    output: {
      basename: "basename",
    },
    processes: { regexp: "^../", enabled: false },
    packages: "bin.cjs",
    recorder: "process",
    hooks: { esm: false, cjs: true, apply: false, http: false },
  },
  async (repository) => {
    if (getPlatform() === "win32") {
      await writeFileAsync(
        joinPath(repository, "bin.cjs"),
        "123;",
        "utf8",
      );
      await writeFileAsync(
        joinPath(repository, "node_modules", ".bin", "bin.cmd"),
        `node ${joinPath(repository, "bin.cjs")}`,
        "utf8",
      );
    } else {
      await writeFileAsync(
        joinPath(repository, "bin"),
        "#!/usr/bin/env node\n123;",
        {
          encoding: "utf8",
          mode: 0o777,
        },
      );
      await symlinkAsync(
        joinPath("..", "..", "bin"),
        joinPath(repository, "node_modules", ".bin", "bin"),
        "dir",
      );
    }
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "basename.appmap.json"),
        "utf8",
      ),
    );
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      { type: "package", name: "bin.cjs", children: [] },
    ]);
  },
);
