import { writeFile, symlink } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    mode: "remote",
    enabled: "process",
    processes: { path: "node_modules/.bin/bin" },
    packages: "bin.cjs",
    recorder: "process",
    hooks: { esm: false, cjs: true, apply: false, http: false },
    scenario: "scenario",
    scenarios: {
      scenario: ["npx", "--always-spawn", "bin"],
    },
  },
  async (repository) => {
    await writeFile(`${repository}/bin`, "#!/usr/bin/env node\n123;", {
      encoding: "utf8",
      mode: 0o777,
    });
    await symlink("../../bin", `${repository}/node_modules/.bin/bin`);
  },
  async (appmaps) => {
    const { "bin.appmap.json": appmap } = appmaps;
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      { type: "package", name: "bin.cjs", children: [] },
    ]);
  },
);
