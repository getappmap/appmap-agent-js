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
        import { strict as Assert } from "node:assert";
        const {
          equal: assertEqual,
          deepEqual: assertDeepEqual,
        } = Assert;
        function* g (x) {
          assertEqual(yield 1 * x, "optional");
          assertEqual(yield* [2 * x, 3  * x], undefined);
          return "result";
        }
        const i = g(2);
        assertDeepEqual(i.next("discarded"), { value: 2, done: false });
        assertDeepEqual(i.next("optional"), { value: 4, done: false });
        assertDeepEqual(i.next("discarded"), { value: 6, done: false });
        assertDeepEqual(i.next(), { value: "result", done: true });
        assertDeepEqual(i.next(), { value: undefined, done: true });
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
          method_id: "g",
        },
        {
          event: "return",
          id: 2,
          parent_id: 1,
        },
      ],
    );
  },
);
