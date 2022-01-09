import {
  writeFile as writeFileAsync,
  readdir as readdirAsync,
  copyFile as copyFileAsync,
} from "fs/promises";
import { platform as getPlatform } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { spawnAsync } from "../spawn.mjs";
import { runAsync } from "../__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    // TODO figure how to do adapt the abomination.
    // The abomination is back to haunt us...
    // On windows files in .bin are not symbolic links but batch file.
    // It does not seem resonable to parse it to uncover the js script it references.
    command:
      getPlatform() === "win32"
        ? "node node_modules/mocha/bin/mocha.cjs main.test.mjs"
        : "npx mocha main.test.mjs",
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
    assertDeepEqual(
      await spawnAsync(
        getPlatform() === "win32" ? "npm.cmd" : "npm",
        ["install", "mocha"],
        { cwd: repository, stdio: "inherit" },
      ),
      { signal: null, status: 0 },
    );
    if (getPlatform() === "win32") {
      await copyFileAsync(
        joinPath(repository, "node_modules", "mocha", "bin", "mocha"),
        joinPath(repository, "node_modules", "mocha", "bin", "mocha.cjs"),
      );
    }
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
