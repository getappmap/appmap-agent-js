import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

await runAsync(
  { name: "app", version: "1.2.3" },
  {
    recorder: "process",
    command: "node main.mjs",
    name: "app-name",
    "map-name": "map-name",
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: false,
    },
    output: { basename: "basename" },
  },
  async (repository) => {
    await writeFileAsync(joinPath(repository, "main.mjs"), `123;`, "utf8");
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "basename.appmap.json"),
        "utf8",
      ),
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
        name: "map-name",
        app: "app-name",
        recorder: { name: "process" },
        test_status: "succeeded",
        exception: null,
      },
    );
  },
);
