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
    command: "node out.mjs",
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
      joinPath(repository, "source.map"),
      JSON.stringify(
        {
          version: 3,
          file: "out.mjs",
          sourceRoot: "",
          sources: ["source.js"],
          sourcesContent: ["function f () {};"],
          names: [],
          mappings: "",
        },
        null,
        2,
      ),
      "utf8",
    );
    await writeFileAsync(
      joinPath(repository, "out.mjs"),
      `
        import { strict as Assert } from "node:assert";
        const {
          equal: assertEqual,
          deepEqual: assertDeepEqual
        } = Assert;
        const rest = (x, ... xs) => ({x, xs});
        assertDeepEqual(
          rest(123, 456, 789),
          { x: 123, xs: [456, 789] },
        );
        const tuple = (x, y) => [x, y];
        assertDeepEqual(
          tuple(123, 456, 789),
          [123, 456],
        );
        assertDeepEqual(
          tuple(123),
          [123, undefined],
        );
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
          method_id: "rest",
        },
        {
          event: "return",
          id: 2,
          parent_id: 1,
        },
        {
          event: "call",
          id: 3,
          method_id: "tuple",
        },
        {
          event: "return",
          id: 4,
          parent_id: 3,
        },
        {
          event: "call",
          id: 5,
          method_id: "tuple",
        },
        {
          event: "return",
          id: 6,
          parent_id: 5,
        },
      ],
    );
  },
);
