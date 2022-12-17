import {
  writeFile as writeFileAsync,
  readFile as readFileAsync,
} from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "./__fixture__.mjs";
import SourceMap from "source-map";

const { JSON } = globalThis;

const { SourceMapGenerator } = SourceMap;

const removeElapsed = ({ elapsed: _, ...rest }) => rest;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    recorder: "process",
    command: "node script.js",
    packages: { glob: "*" },
    appmap_file: "basename",
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
      joinPath(repository, "source.js"),
      [
        "// Source //",
        "function f (x) {}",
        "f();",
        "function g () {}",
        "g();",
      ].join("\n"),
      "utf8",
    );
    await writeFileAsync(
      joinPath(repository, "script.js"),
      [
        "function f () {}",
        "f();",
        "function g (x) {}",
        "g();",
        "//# sourceMappingURL=source.map",
      ].join("\n"),
      "utf8",
    );
    const generator = new SourceMapGenerator();
    generator.addMapping({
      source: "source.js",
      original: { line: 2, column: 0 },
      generated: { line: 1, column: 0 },
    });
    generator.addMapping({
      source: "source.js",
      original: { line: 4, column: 0 },
      generated: { line: 3, column: 0 },
    });
    await writeFileAsync(
      joinPath(repository, "source.map"),
      generator.toString(),
      "utf8",
    );
  },
  async (directory) => {
    const { events } = JSON.parse(
      await readFileAsync(
        joinPath(directory, "tmp", "appmap", "process", "basename.appmap.json"),
        "utf8",
      ),
    );
    assertDeepEqual(events.map(removeElapsed), [
      {
        event: "call",
        thread_id: 0,
        id: 1,
        defined_class: "source",
        method_id: "f",
        path: "source.js",
        lineno: 2,
        static: false,
        receiver: {
          name: "this",
          class: "Object",
          object_id: 1,
          value: "[object global]",
        },
        parameters: [],
      },
      {
        event: "return",
        thread_id: 0,
        id: 2,
        parent_id: 1,
        return_value: {
          name: "return",
          class: "undefined",
          value: "undefined",
        },
      },
      {
        event: "call",
        thread_id: 0,
        id: 3,
        defined_class: "source",
        method_id: "g",
        path: "source.js",
        lineno: 4,
        static: false,
        receiver: {
          name: "this",
          class: "Object",
          object_id: 1,
          value: "[object global]",
        },
        parameters: [],
      },
      {
        event: "return",
        thread_id: 0,
        id: 4,
        parent_id: 3,
        return_value: {
          name: "return",
          class: "undefined",
          value: "undefined",
        },
      },
    ]);
  },
);
