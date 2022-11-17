import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";

const { JSON } = globalThis;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    packages: { glob: "*" },
    command: "node main.mjs",
    appmap_file: "basename",
    hooks: {
      esm: true,
      cjs: true,
      apply: true,
      http: false,
    },
    ordering: "chronological",
  },
  async (repository) => {
    await writeFileAsync(
      joinPath(repository, "main.mjs"),
      `
        async function* generateAsync (x) {
          yield 1 * x;
          (function beforeAwait () {} ());
          await new Promise(function promiseCallback (resolve, reject) {
            setTimeout(function timeoutCallback () {
              resolve();
            }, 0);
          });
          (function afterAwait () {} ());
          yield* [2 * x, 3  * x];
        }
        const mainAsync = async () => {
          const iterateAsync = generateAsync(2);
          console.log(await iterateAsync.next());
          console.log(await iterateAsync.next());
          console.log(await iterateAsync.next());
          console.log(await iterateAsync.next());
        };
        mainAsync();
        ((() => {}) ());
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
    assertDeepEqual(
      events.map(({ event, method_id, id, parent_id }) => ({
        event,
        id,
        ...(event === "call" ? { method_id } : { parent_id }),
      })),
      [
        {
          event: "call",
          id: 1,
          method_id: "mainAsync",
        },
        {
          event: "call",
          id: 2,
          method_id: "generateAsync",
        },
        {
          event: "call",
          id: 3,
          method_id: "beforeAwait",
        },
        {
          event: "return",
          id: 4,
          parent_id: 3,
        },
        {
          event: "call",
          id: 5,
          method_id: "promiseCallback",
        },
        {
          event: "return",
          id: 6,
          parent_id: 5,
        },
        {
          event: "call",
          id: 7,
          method_id: "afterAwait",
        },
        {
          event: "return",
          id: 8,
          parent_id: 7,
        },
        {
          event: "return",
          id: 9,
          parent_id: 2,
        },
        {
          event: "return",
          id: 10,
          parent_id: 1,
        },
        {
          event: "call",
          id: 11,
          method_id: "[anonymous]",
        },
        {
          event: "return",
          id: 12,
          parent_id: 11,
        },
        {
          event: "call",
          id: 13,
          method_id: "timeoutCallback",
        },
        {
          event: "return",
          id: 14,
          parent_id: 13,
        },
      ],
    );
  },
);
