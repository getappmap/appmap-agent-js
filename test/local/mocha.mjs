import {
  writeFile as writeFileAsync,
  symlink as symlinkAsync,
  realpath as realpathAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { platform as getPlatform} from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { runAsync } from "../__fixture__.mjs";

const { cwd } = process;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    command: [getPlatform() === "win32" ? "npx.cmd" : "npx", "mocha", "main.test.mjs"],
    recorder: "mocha",
    packages: { path: "index.js" },
    hooks: {
      esm: false,
      cjs: true,
      apply: true,
      http: false,
    },
  },
  async (repository) => {
    await symlinkAsync(
      await realpathAsync(joinPath(cwd(), "node_modules", ".bin", "mocha")),
      joinPath(repository, "node_modules", ".bin", "mocha"),
      "dir",
    );
    await writeFileAsync(
      joinPath(repository, "main.mjs"),
      `
        export const main = () => "main";
        export const mainAsync = async () => "main";
      `,
      "utf8",
    );
    await writeFileAsync(
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
      new Set(
        await readdirAsync(joinPath(directory, "tmp", "appmap", "mocha")),
      ),
      new Set([
        "suite.appmap.json",
        "suite-1.appmap.json",
        "suite-2.appmap.json",
      ]),
    );
  },
);
