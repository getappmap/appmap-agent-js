import fs from 'fs';
import { tmpdir } from "os";
import { basename } from "path";
import { strict as assert } from "assert";
import { mkdir /*, writeFile, symlink*/ } from "fs/promises";
import { buildTestDependenciesAsync } from "../../build.mjs";
import YAML from "yaml";
import {afterEach, beforeEach, describe, it} from "mocha";
import * as sinon from "sinon";

import Init, {externals} from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { main, run } = Init(dependencies);

describe("the init command", () => {
  let directory;
  beforeEach(async () => {
    directory = `${tmpdir()}/${Math.random().toString(36).substring(2)}`;
    await mkdir(directory);
    externals.showResults = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("main", () => {
    it("works", () => {
      assert(main(directory));
    });
  });

  describe("run", () => {
    it("creates config when source files are present", () => {
      const cwd = process.cwd();
      process.chdir(directory);
      try {
        fs.mkdirSync('src');
        fs.mkdirSync('lib/sub1/sub2', {recursive: true});
        fs.mkdirSync('noaccess'); fs.chmodSync('noaccess', 0);

        fs.writeFileSync('src/file1.js', '/* empty file */\n');
        // presence of file2.js should cause tree to get pruned at sub1,
        // lib/sub1/sub2 shouldn't appear in the config
        fs.writeFileSync('lib/sub1/file2.js', '/* also empty file */\n');
        fs.writeFileSync('lib/sub1/sub2/file2.js', '/* one more empty file */\n');
      }
      finally {
        process.chdir(cwd);
      }

      const result = JSON.parse(run(directory));
      assert.equal(result.filename, "appmap.yml");
      assert(result.configuration.contents.length > 0, "Missing configuration");
      const config = YAML.parse(result.configuration.contents);
      assert.equal(config.name, basename(directory));
      assert.notEqual(config.packages, undefined);
      assert(typeof config.packages, "array");
      config.packages.sort((a,b) => a.path.localeCompare(b.path));
      assert.deepEqual(config.packages, [
        { path: 'lib/sub1' },
        { path: 'src' },
      ]);
    });
  });
});
