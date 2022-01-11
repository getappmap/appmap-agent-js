import {
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { platform as getPlatform } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { spawnStrictAsync } from "../../spawn.mjs";
import { runAsync } from "./__fixture__.mjs";

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    command: [
      getPlatform() === "win32" ? "npx.cmd" : "npx",
      "mocha",
      "main.test.mjs",
    ],
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
    await spawnStrictAsync(
      getPlatform() === "win32" ? "npm.cmd" : "npm",
      ["install", "mocha"],
      { cwd: repository, stdio: "inherit" },
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
