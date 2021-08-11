import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { deepEqual: assertDeepEqual } = Assert;

export default async (protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      protocol,
      "function-name-placeholder": "$",
      children: [["node", "./main.mjs"]],
      packages: [{ glob: "*" }],
      hooks: {
        esm: true,
        cjs: true,
        apply: true,
      },
      output: { filename: "filename" },
    },
    async (repository) => {
      await writeFile(
        `${repository}/main.mjs`,
        `function main() { return 456; }; main(123);`,
        "utf8",
      );
    },
    async (appmaps) => {
      const { "filename.appmap.json": appmap } = appmaps;
      const { events } = appmap;
      /* eslint-disable no-unused-vars */
      const [event1, { elapsed, ...event2 }] = events;
      /* eslint-enable no-unused-vars */
      assertDeepEqual(
        [event1, event2],
        [
          {
            id: 2,
            event: "call",
            thread_id: 0,
            defined_class: "$",
            method_id: "main",
            path: "main.mjs",
            lineno: 1,
            static: false,
            receiver: {
              name: "this",
              class: "undefined",
              object_id: null,
              value: "undefined",
            },
            parameters: [],
          },
          {
            id: 3,
            event: "return",
            thread_id: 0,
            parent_id: 2,
            return_value: {
              name: "return",
              class: "number",
              object_id: null,
              value: "456",
            },
            exceptions: null,
          },
        ],
      );
    },
  );
};
