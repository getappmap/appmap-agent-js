import {
  assertEqual,
  assertDeepEqual,
  getTemporaryDirectoryURL,
  getFreshTemporaryURL,
} from "../../__fixture__.mjs";
import { createRequire } from "module";
import { writeFile as writeFileAsync } from "fs/promises";
import { pathToFileURL, fileURLToPath } from "url";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookCjs from "./index.mjs?env=test";

const { URL } = globalThis;

const require = createRequire(new URL(import.meta.url));

const url = getFreshTemporaryURL();

await writeFileAsync(new URL(url), "module.exports = 123;", "utf8");

assertDeepEqual(
  await testHookAsync(
    HookCjs,
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
    () => {
      assertEqual(require(fileURLToPath(url)), 123);
    },
  ),
  [],
);

delete require.cache[require.resolve(fileURLToPath(url))];

assertDeepEqual(
  await testHookAsync(
    HookCjs,
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
    () => {
      assertEqual(require(fileURLToPath(url)), 123);
    },
  ),
  [
    {
      type: "source",
      url: pathToFileURL(require.resolve(fileURLToPath(url))).toString(),
      content: "module.exports = 123;",
      exclude: createConfiguration("file:///w:/home").exclude,
      shallow: true,
      inline: false,
    },
  ],
);
