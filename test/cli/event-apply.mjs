import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    enabled: true,
    mode: "remote",
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
        async function* generateAsync (x) {
          yield 1 * x;
          await new Promise((resolve, reject) => {
            setTimeout(resolve, 0);
          });
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
      `,
      "utf8",
    );
  },
  async (appmaps) => {
    const { "main.appmap.json": appmap } = appmaps;
    const { events } = appmap;
    assertDeepEqual(
      events.map(({elapsed, ...rest}) => rest),
      [
        {
          event: 'call',
          thread_id: 0,
          id: 2,
          defined_class: 'mainAsync',
          method_id: 'placeholder',
          path: 'main.mjs',
          lineno: 9,
          static: false,
          receiver: {
            name: 'this',
            class: 'undefined',
            object_id: null,
            value: 'undefined'
          },
          parameters: []
        },
        {
          event: 'call',
          thread_id: 0,
          id: 4,
          defined_class: 'generateAsync',
          method_id: 'placeholder',
          path: 'main.mjs',
          lineno: 2,
          static: false,
          receiver: {
            name: 'this',
            class: 'undefined',
            object_id: null,
            value: 'undefined'
          },
          parameters: [ { name: 'x', class: 'number', object_id: null, value: '2' } ]
        },
        {
          event: 'call',
          thread_id: 0,
          id: 10,
          defined_class: 'arrow-1',
          method_id: 'placeholder',
          path: 'main.mjs',
          lineno: 4,
          static: false,
          receiver: {
            name: 'this',
            class: 'undefined',
            object_id: null,
            value: 'undefined'
          },
          parameters: [
            {
              name: 'resolve',
              class: 'Function',
              object_id: 1,
              value: '[object Function]'
            },
            {
              name: 'reject',
              class: 'Function',
              object_id: 2,
              value: '[object Function]'
            }
          ]
        },
        {
          event: 'return',
          thread_id: 0,
          id: 11,
          parent_id: 10,
          return_value: null,
          exceptions: null
        },
        {
          event: 'return',
          thread_id: 0,
          id: 5,
          parent_id: 4,
          return_value: null,
          exceptions: null
        },
        {
          event: 'return',
          thread_id: 0,
          id: 3,
          parent_id: 2,
          return_value: null,
          exceptions: null
        }
      ]
    );
  },
);
