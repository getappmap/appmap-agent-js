import { strict as Assert } from "assert";
import { createRequire } from "module";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { buildTestAsync } from "../../../build/index.mjs";
import Common from "./common.mjs";

const { cwd } = process;
const { random } = Math;
const {
  // ok: assert,
  equal: assertEqual,
  // notEqual: assertNotEqual,
  deepEqual: assertDeepEqual,
} = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({
    ...import.meta,
    deps: ["hook"],
  });
  const {
    hook: { testHookAsync },
  } = dependencies;
  const { hookCommonModuleAsync } = Common(dependencies);
  const require = createRequire(cwd());
  const { resolve } = require;
  const path = `${tmpdir()}/${random().toString(36).substring(2)}.js`;
  assertDeepEqual(
    await testHookAsync(
      hookCommonModuleAsync,
      {
        conf: {
          hooks: { cjs: true },
          packages: [
            {
              regexp: "^",
            },
          ],
        },
      },
      async () => {
        await writeFile(path, "module.exports = 123;", "utf8");
        assertEqual(require(path), 123);
      },
    ),
    [
      {
        type: "send",
        session: "uuid",
        data: {
          type: "file",
          data: {
            index: 0,
            type: "script",
            path: resolve(path),
            code: "module.exports = 123;",
          },
        },
      },
    ],
  );
};

testAsync();
