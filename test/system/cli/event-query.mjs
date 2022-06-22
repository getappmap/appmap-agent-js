import {
  writeFile as writeFileAsync,
  symlink as symlinkAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";

const { cwd } = process;
const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    command: "node main.mjs",
    hooks: {
      esm: false,
      cjs: false,
      apply: false,
      http: false,
      sqlite3: true,
    },
    appmap_file: "basename",
  },
  async (repository) => {
    await symlinkAsync(
      joinPath(cwd(), "node_modules", "sqlite3"),
      joinPath(repository, "node_modules", "sqlite3"),
      "dir",
    );
    await writeFileAsync(
      joinPath(repository, "main.mjs"),
      `
        import Sqlite3 from "sqlite3";
        const {Database} = Sqlite3;
        const database = new Database(":memory:");
        database.get("SELECT ? * ? as SOLUTION", 2, 3);
      `,
      "utf8",
    );
  },
  async (directory) => {
    const appmap = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "process", "basename.appmap.json"),
        "utf8",
      ),
    );
    const { events } = appmap;
    /* eslint-disable no-unused-vars */
    const [event1, { elapsed, ...event2 }] = events;
    /* eslint-enable no-unused-vars */
    assertDeepEqual(
      [event1, event2],
      [
        {
          id: 1,
          event: "call",
          thread_id: 0,
          sql_query: {
            database_type: "sqlite3",
            server_version: null,
            sql: "SELECT ? * ? as SOLUTION",
            explain_sql: null,
          },
          message: [
            {
              name: "0",
              class: "number",
              object_id: null,
              value: "2",
            },
            {
              name: "1",
              class: "number",
              object_id: null,
              value: "3",
            },
          ],
        },
        {
          id: 2,
          event: "return",
          thread_id: 0,
          parent_id: 1,
        },
      ],
    );
  },
);
