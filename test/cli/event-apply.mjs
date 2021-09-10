import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    enabled: true,
    mode: "remote",
    log: "debug",
    protocol: "tcp",
    "function-name-placeholder": "placeholder",
    packages: { glob: "*" },
    hooks: {
      esm: true,
      cjs: true,
      apply: true,
      group: true,
      http: false,
    },
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await writeFile(
      `${repository}/main.mjs`,
      `
        const main = async (x) => {
          return await new Promise((resolve, reject) => {
            setTimeout(resolve, 1000, 456);
          });
        };
        main(123);
      `,
      "utf8",
    );
  },
  async (appmaps) => {
    const { "main.appmap.json": appmap } = appmaps;
    const { events } = appmap;
    /* eslint-disable no-unused-vars */
    const [event1, { elapsed, ...event2 }] = events;
    /* eslint-enable no-unused-vars */
    assertDeepEqual(
      events.map(({elapsed, ...rest}) => rest),
      [
        {
          id: 1,
          event: "call",
          thread_id: 0,
          defined_class: "main",
          method_id: "placeholder",
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
          id: 2,
          event: "return",
          thread_id: 0,
          parent_id: 1,
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
