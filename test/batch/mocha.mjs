import { writeFile, symlink, realpath } from "fs/promises";
import { strict as Assert } from "assert";
import { runAsync } from "./__fixture__.mjs";

const { cwd } = process;

const {
  // deepEqual: assertDeepEqual
} = Assert;

await runAsync(
  null,
  {
    enabled: true,
    "log-level": "debug",
    name: "name",
    mode: "remote",
    recorder: "mocha",
    packages: { path: "index.js" },
    hooks: {
      esm: false,
      cjs: true,
      apply: true,
    },
    output: { filename: "filename" },
    scenario: "scenario",
    scenarios: {
      scenario: ["node", "./main.mjs"],
    },
  },
  async (repository) => {
    await symlink(
      await realpath(`${cwd()}/node_modules/.bin/mocha`),
      `${repository}/node_modules/.bin/mocha`,
    );
    await writeFile(
      `${repository}/index.js`,
      `
        exports.main = () => "main";
        exports.mainAsync = async () => "main";
      `,
      "utf8",
    );
    await writeFile(
      `${repository}/index.test.js`,
      `
        const {strict : Assert} = require("assert");
        const {main, mainAsync} = require("./index.js");
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
  async (appmaps) => {
    console.log(appmaps);
  },
);
