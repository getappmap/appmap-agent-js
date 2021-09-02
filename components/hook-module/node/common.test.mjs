import { strict as Assert } from "assert";
import { createRequire } from "module";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Common from "./common.mjs";

Error.stackTraceLimit = Infinity;

const { cwd } = process;
const { random } = Math;
const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { testHookAsync } = await buildTestComponentAsync("hook");
  const { hookCommonModule, unhookCommonModule } = Common(dependencies);
  const require = createRequire(`${cwd()}/dummy.js`);
  const { resolve } = require;
  const path = `${tmpdir()}/${random().toString(36).substring(2)}.js`;
  await writeFile(path, "module.exports = 123;", "utf8");
  const resolved_path = resolve(path);
  assertDeepEqual(
    await testHookAsync(
      hookCommonModule,
      unhookCommonModule,
      {
        hooks: { cjs: false },
        packages: [
          {
            regexp: "^",
          },
        ],
      },
      async () => {
        assertEqual(require(path), 123);
      },
    ),
    [],
  );
  delete require.cache[resolved_path];
  assertDeepEqual(
    await testHookAsync(
      hookCommonModule,
      unhookCommonModule,
      {
        hooks: { cjs: true },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      async () => {
        assertEqual(require(path), 123);
      },
    ),
    [
      {
        type: "trace",
        data: {
          type: "file",
          data: {
            index: 0,
            exclude: [],
            type: "script",
            path: resolved_path,
            code: "module.exports = 123;",
            shallow: true,
          },
        },
      },
    ],
  );
};

testAsync();
