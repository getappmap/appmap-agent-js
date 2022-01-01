import { writeFile, symlink, readFile } from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    command: ["npx", "--always-spawn", "bin"],
    pruning: false,
    output: {
      basename: "basename",
    },
    processes: { path: joinPath("node_modules", ".bin", "bin") },
    packages: "bin.cjs",
    recorder: "process",
    hooks: { esm: false, cjs: true, apply: false, http: false },
  },
  async (repository) => {
    await writeFile(joinPath(repository, "bin"), "#!/usr/bin/env node\n123;", {
      encoding: "utf8",
      mode: 0o777,
    });
    await symlink(
      joinPath("..", "..", "bin"),
      joinPath(repository, "node_modules", ".bin", "bin"),
    );
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFile(
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
