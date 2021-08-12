import { writeFile } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { equal: assertEqual, deepEqual: assertDeepEqual } = Assert;

export default async (protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      protocol,
      packages: [{ regexp: "^" }],
      hooks: {
        esm: true,
        cjs: true,
      },
      output: { filename: "filename" },
      validate: {
        message: true,
        appmap: true,
      },
    },
    ["node", "./main.mjs"],
    async (repository) => {
      await writeFile(`${repository}/main.mjs`, ``, "utf8");
    },
    async (appmaps) => {
      const { "filename.appmap.json": appmap } = appmaps;
      const { metadata } = appmap;
      const { name, app, client, recorder, test_status, exception } = metadata;
      {
        const { name } = client;
        assertEqual(name, "@appland/appmap-agent-js");
      }
      assertDeepEqual(
        { name, app, recorder, test_status, exception },
        {
          name: "name",
          app: "app",
          recorder: { name: "process" },
          test_status: "succeeded",
          exception: null,
        },
      );
    },
  );
};
