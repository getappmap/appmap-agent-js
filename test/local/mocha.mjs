import { writeFile, symlink, realpath, readdir } from "fs/promises";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { cwd } = process;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    command: ["npx", "mocha", "main.test.mjs"],
    recorder: "mocha",
    log: "info",
    packages: { path: "index.js" },
    hooks: {
      esm: false,
      cjs: true,
      apply: true,
      http: false,
    },
  },
  async (repository) => {
    await symlink(
      await realpath(joinPath(cwd(), "node_modules", ".bin", "mocha")),
      joinPath(repository, "node_modules", ".bin", "mocha"),
    );
    await writeFile(
      joinPath(repository, "main.mjs"),
      `
        export const main = () => "main";
        export const mainAsync = async () => "main";
      `,
      "utf8",
    );
    await writeFile(
      joinPath(repository, "main.test.mjs"),
      `
        import {strict as Assert} from "assert";
        import {main, mainAsync} from "./main.mjs";
        const {equal:assertEqual} = Assert;
        describe("suite", function() {
          it("main", function() {
            assertEqual(main(), "main");
          });
          it("mainCallback", function (done) {
            setTimeout(done, 0);
          });
          it("mainAsync", async function () {
            assertEqual(await mainAsync(), "main");
          });
        });
      `,
      "utf8",
    );
  },
  async (directory) => {
    assertDeepEqual(
      new Set(await readdir(joinPath(directory, "tmp", "appmap", "mocha"))),
      new Set([
        "suite.appmap.json",
        "suite-1.appmap.json",
        "suite-2.appmap.json",
      ]),
    );
  },
);
