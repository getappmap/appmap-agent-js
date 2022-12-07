import {
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { platform as getPlatform } from "os";
import { strict as Assert } from "assert";
import { join as joinPath } from "path";
import { spawnStrictAsync } from "../../spawn.mjs";
import { runAsync } from "./__fixture__.mjs";

const { Set } = globalThis;

const { deepEqual: assertDeepEqual } = Assert;

await runAsync(
  null,
  {
    command: [
      getPlatform() === "win32" ? "npx.cmd" : "npx",
      "jest",
      "--testMatch",
      "**/*.test.mjs",
    ],
    recorder: "jest",
    packages: { glob: "*" },
    hooks: {
      esm: true,
      cjs: false,
      apply: true,
      http: false,
    },
  },
  async (repository) => {
    await spawnStrictAsync(
      getPlatform() === "win32" ? "npm.cmd" : "npm",
      ["install", "jest"],
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
        import * as Jest from "@jest/globals";
        import { main, mainAsync } from "./main.mjs";
        const { test, expect } = Jest;
        test("main-sync", () => {
          expect(main()).toBe("main");
        });
        test("main-async", async () => {
          expect(await mainAsync()).toBe("main");
        });
        test("main-callback", (done) => {
          mainAsync().then((res) => {
            try {
              expect(res).toBe("main");
              done();
            } catch (error) {
              done(error);
            }
          });
        });
      `,
      "utf8",
    );
  },
  async (directory) => {
    assertDeepEqual(
      new Set(await readdirAsync(joinPath(directory, "tmp", "appmap", "jest"))),
      new Set([
        "main-sync.appmap.json",
        "main-async.appmap.json",
        "main-callback.appmap.json",
      ]),
    );
  },
);
