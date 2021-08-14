import { writeFile, symlink } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    mode: "remote",
    enabled: { path: "node_modules/.bin/main" },
    packages: "main.js",
    recorder: "process",
    hooks: { cjs: true },
    scenario: "scenario",
    scenarios: {
      scenario: ["npx", "main"],
    },
  },
  async (repository) => {
    await writeFile(`${repository}/main.js`, "#!/usr/bin/env node\n123;", {
      encoding: "utf8",
      mode: 0o777,
    });
    await symlink("../../main.js", `${repository}/node_modules/.bin/main`);
  },
  async (appmaps) => {
    const { "main.appmap.json": appmap } = appmaps;
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      { type: "package", name: "main.js", children: [] },
    ]);
  },
);
