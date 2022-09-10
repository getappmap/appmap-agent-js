import {
  assertEqual,
  assertDeepEqual,
  getTemporaryDirectoryURL,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { createRequire } from "module";
import { writeFile as writeFileAsync } from "fs/promises";
import { pathToFileURL, fileURLToPath } from "url";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Common from "./index.mjs";

const {URL} = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const component = Common(dependencies);
const require = createRequire(new URL(import.meta.url));
const url = getFreshTemporaryURL();
await writeFileAsync(new URL(url), "module.exports = 123;", "utf8");
assertDeepEqual(
  await testHookAsync(
    component,
    {
      configuration: {
        hooks: { cjs: false },
        packages: [
          {
            regexp: "^",
          },
        ],
      },
      url: getTemporaryDirectoryURL(),
    },
    async () => {
      assertEqual(require(fileURLToPath(url)), 123);
    },
  ),
  [],
);
delete require.cache[require.resolve(fileURLToPath(url))];
assertDeepEqual(
  await testHookAsync(
    component,
    {
      configuration: {
        hooks: { cjs: true },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      url: getTemporaryDirectoryURL(),
    },
    async () => {
      assertEqual(require(fileURLToPath(url)), 123);
    },
  ),
  [
    {
      type: "source",
      url: pathToFileURL(require.resolve(fileURLToPath(url))).toString(),
      content: "module.exports = 123;",
      exclude: createConfiguration("file:///home").exclude,
      shallow: true,
      inline: false,
    },
  ],
);
