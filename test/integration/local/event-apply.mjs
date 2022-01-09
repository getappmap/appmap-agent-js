import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    packages: { glob: "*" },
    command: "node main.mjs",
    output: {
      basename: "basename",
    },
    hooks: {
      esm: true,
      cjs: true,
      apply: true,
      http: false,
    },
    ordering: "causal",
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
        joinPath(directory, "tmp", "appmap", "basename.appmap.json"),
        "utf8",
      ),
    );
    const { events } = appmap;
    assertDeepEqual(
      events.map(({ event, defined_class, id, parent_id }) => ({
        event,
        id,
        ...(event === "call" ? { defined_class } : { parent_id }),
      })),
      [
        {
          event: "call",
          id: 1,
          defined_class: "mainAsync",
        },
        {
          event: "call",
          id: 2,
          defined_class: "generateAsync",
        },
        {
          event: "call",
          id: 3,
          defined_class: "beforeAwait",
        },
        {
          event: "return",
          id: 4,
          parent_id: 3,
        },
        {
          event: "call",
          id: 5,
          defined_class: "promiseCallback",
        },
        {
          event: "call",
          id: 6,
          defined_class: "timeoutCallback",
        },
        {
          event: "return",
          id: 7,
          parent_id: 6,
        },
        {
          event: "return",
          id: 8,
          parent_id: 5,
        },
        {
          event: "call",
          id: 9,
          defined_class: "afterAwait",
        },
        {
          event: "return",
          id: 10,
          parent_id: 9,
        },
        {
          event: "return",
          id: 11,
          parent_id: 2,
        },
        {
          event: "return",
          id: 12,
          parent_id: 1,
        },
      ],
    );
  },
);
