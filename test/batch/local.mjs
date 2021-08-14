import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    enabled: true,
    mode: "local",
    packages: [{ glob: "*" }],
    hooks: {
      esm: true,
      cjs: true,
    },
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await writeFile(
      `${repository}/main.mjs`,
      "class c {}",
      "utf8",
    );
  },
  async (appmaps) => {
    const { "main.appmap.json": appmap } = appmaps;
    const { classMap: classmap } = appmap;
    assertDeepEqual(classmap, [
      {
        type: "package",
        name: "main.mjs",
        children: [
          {
            type: "class",
            name: "c",
            children: [],
          },
        ],
      },
    ]);
  },
);
