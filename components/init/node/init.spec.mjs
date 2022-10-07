import fs from "fs";
import { basename as getBasename, join as joinPath } from "path";
import { tmpdir } from "os";
import { strict as assert } from "assert";
import { mkdir } from "fs/promises";
import YAML from "yaml";
import Mocha from "mocha";
import * as sinon from "sinon";
import "../../__fixture__.mjs";
import { externals, main, run } from "./index.mjs?env=test";

const { Math, process, JSON, undefined } = globalThis;

const { afterEach, beforeEach, describe, it } = Mocha;

describe("the init command", () => {
  let directory;
  let cwd;
  beforeEach(async () => {
    directory = joinPath(tmpdir(), Math.random().toString(36).substring(2));
    await mkdir(directory);
    externals.showResults = sinon.stub();
    cwd = process.cwd();
    process.chdir(directory);
  });

  afterEach(() => {
    sinon.restore();
    process.chdir(cwd);
  });

  describe("main", () => {
    it("works", () => {
      assert(main(directory));
    });
  });

  describe("run", () => {
    it("creates config when source files are present", () => {
      fs.mkdirSync("src");
      fs.mkdirSync("lib/sub1/sub2", { recursive: true });
      fs.writeFileSync("src/file1.js", "/* empty file */\n");
      fs.writeFileSync("lib/sub1/file2.js", "/* also empty file */\n");

      const result = JSON.parse(run(directory));
      assert.equal(result.filename, "appmap.yml");
      assert(result.configuration.contents.length > 0, "Missing configuration");
      const config = YAML.parse(result.configuration.contents);
      assert.equal(config.name, getBasename(directory));
      assert.notEqual(config.packages, undefined);
      assert(typeof config.packages, "array");
      config.packages.sort((a, b) => a.path.localeCompare(b.path));
      assert.deepEqual(config.packages, [
        { path: joinPath("lib", "sub1") },
        { path: "src" },
      ]);
    });

    it("doesn't descend past directory containing a source file", () => {
      fs.mkdirSync("lib/sub1/sub2", { recursive: true });
      // presence of file2.js should cause tree to get pruned at sub1,
      // lib/sub1/sub2 shouldn't appear in the config
      fs.writeFileSync("lib/sub1/file2.js", "/* also empty file */\n");
      fs.writeFileSync("lib/sub1/sub2/file2.js", "/* one more empty file */\n");
      const result = JSON.parse(run(directory));
      const config = YAML.parse(result.configuration.contents);
      config.packages.sort((a, b) => a.path.localeCompare(b.path));
      assert.deepEqual(config.packages, [{ path: joinPath("lib", "sub1") }]);
    });

    it("isn't confused by inaccessible directories", () => {
      fs.mkdirSync("noaccess");
      fs.chmodSync("noaccess", 0);
      const result = JSON.parse(run(directory));
      assert.ok(result);
    });

    it("ignores node_modules", () => {
      // node_modules should get ignored, no matter where they appear.
      fs.mkdirSync("node_modules");
      fs.mkdirSync("pkg/node_modules/dep", { recursive: true });

      fs.writeFileSync(
        "pkg/node_modules/dep/file3.js",
        "/* empty dep source file */\n",
      );
      const result = JSON.parse(run(directory));
      const config = YAML.parse(result.configuration.contents);
      assert.equal(config.packages.length, 0);
    });

    it("doesn't include duplicates", () => {
      fs.mkdirSync("src");
      fs.writeFileSync("src/file1.js", "/* empty file */\n");
      fs.writeFileSync("src/file1.js.map", "/* empty file */\n");

      const result = JSON.parse(run(directory));
      const config = YAML.parse(result.configuration.contents);
      assert.equal(config.packages.length, 1);
      assert.deepEqual(config.packages, [{ path: "src" }]);
    });
  });
});
