import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const {
  // deepEqual: assertDeepEqual,
  ok: assert,
} = Assert;

await runAsync(
  null,
  {
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: false,
    },
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await writeFile(`${repository}/main.mjs`, "123;", "utf8");
  },
  async (appmaps) => {
    assert("main.appmap.json" in appmaps);
  },
);
