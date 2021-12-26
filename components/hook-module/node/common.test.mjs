import {
  assertEqual,
  assertDeepEqual,
  getFreshTemporaryPath,
  makeAbsolutePath,
} from "../../__fixture__.mjs";
import { createRequire } from "module";
import { writeFile } from "fs/promises";
import { pathToFileURL } from "url";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Common from "./common.mjs";

const { cwd } = process;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { testHookAsync } = await buildTestComponentAsync("hook");
const { hookCommonModule, unhookCommonModule } = Common(dependencies);
const require = createRequire(`${cwd()}/dummy.js`);
const { resolve } = require;
const path = getFreshTemporaryPath();
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
  { sources: [], events: [] },
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
  {
    sources: [
      {
        url: pathToFileURL(resolved_path).toString(),
        content: "module.exports = 123;",
        exclude: createConfiguration(makeAbsolutePath("dummy")).exclude,
        shallow: true,
        inline: false,
      },
    ],
    events: [],
  },
);
