import { writeFile, readFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

await runAsync(
  { name: "app", version: "1.2.3" },
  {
    mode: "local",
    name: "name",
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: false,
    },
    output: { basename: "basename" },
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await writeFile(`${repository}/main.mjs`, `123;`, "utf8");
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFile(`${directory}/tmp/appmap/basename.appmap.json`, "utf8"),
    );
    const { metadata } = appmap;
    const { name, app, client, recorder, test_status, exception } = metadata;
    {
      const { name } = client;
      assertEqual(name, "@appland/appmap-agent-js");
    }
    assertDeepEqual(
      { name, app, recorder, test_status, exception },
      {
        name: "name",
        app: "app",
        recorder: { name: "process" },
        test_status: "succeeded",
        exception: null,
      },
    );
  },
);
