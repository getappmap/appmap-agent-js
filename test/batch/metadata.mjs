
import {mkdir, readFile, writeFile} from "fs/promises";
import {strict as Assert} from "assert";
import {setupAsync} from "./setup.mjs";

const {equal:assertEqual, deepEqual:assertDeepEqual} = Assert;

const testAsync = async () => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      name: "name",
      protocol: "inline",
      children: [["node", "./main.mjs"]],
      packages: [{regexp:"^"}],
      hooks: {
        esm: true,
      },
      output: {filename:"filename"},
    },
    async (repository) => {
      await writeFile(
        `${repository}/main.mjs`,
        ``,
        "utf8"
      );
    },
    async (appmaps) => {
      const {"filename.appmap.json":appmap} = appmaps;
      const {metadata} = appmap;
      const {name, app, client, recorder, test_status, exception} = metadata;
      {
        const {name} = client;
        assertEqual(name, "@appland/appmap-agent-js");
      }
      assertDeepEqual({name, app, recorder, test_status, exception}, {
        name: "name",
        app: "app",
        recorder: "process",
        test_status: "succeeded",
        exception: null,
      });
    },
  );
};

testAsync();
