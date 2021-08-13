import { writeFile, symlink } from "fs/promises";
import { strict as Assert } from "assert";
import { setupAsync } from "./setup.mjs";

const { cwd } = process;

const {
  // deepEqual: assertDeepEqual
} = Assert;

export default async (mode, protocol) => {
  await setupAsync(
    "app",
    "1.2.3",
    {
      enabled: true,
      "log-level": "debug",
      name: "name",
      mode,
      protocol,
      recorder: "process",
      packages: { path: "index.mjs" },
      hooks: {
        esm: true,
        cjs: true,
        apply: true,
      },
      output: { filename: "filename" },
      validate: {
        message: true,
        appmap: true,
      },
    },
    ["npx", "mocha", "./index.test.mjs"],
    async (repository) => {
      await symlink(
        `${cwd()}/node_modules/mocha`,
        `${repository}/node_modules/mocha`,
      );
      await writeFile(
        `${repository}/index.mjs`,
        `
          export const main = () => "main";
          export const mainAynsc = async () => "main";
        `,
        "utf8",
      );
      await writeFile(
        `${repository}/index.test.mjs`,
        `
          import {strict as Assert} from "assert";
          import {main, mainAsync, mainCallback} from "./index.mjs";
          const {equal:assertEqual} = Assert;
          describe("suite", function() {
            it("main", function() {
              assertEqual(main(), "main");
            });
            it("mainCallback", function (done) {
              setTimeout(done, 0);
            });
            it("mainAsync", async function () {
              assertEqual(await(mainAsync()), "main");
            });
          });
        `,
        "utf8",
      );
    },
    async (appmaps) => {
      console.log(appmaps);
    },
  );
};
