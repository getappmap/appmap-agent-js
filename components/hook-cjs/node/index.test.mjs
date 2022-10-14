const { URL } = globalThis;

import { createRequire } from "node:module";
import {
  writeFile as writeFileAsync,
  realpath as realpathAsync,
} from "node:fs/promises";

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { getTmpUrl, convertPathToFileUrl } from "../../path/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookCjs from "./index.mjs?env=test";

const relative = `./${getUuid()}.js`;

const url = toAbsoluteUrl(relative, getTmpUrl());

const require = createRequire(new URL(url));

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
      url,
    },
    () => {
      assertEqual(require(relative), 123);
    },
  ),
  [],
);

delete require.cache[require.resolve(relative)];

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
      url,
    },
    () => {
      assertEqual(require(relative), 123);
    },
  ),
  [
    {
      type: "source",
      url: convertPathToFileUrl(await realpathAsync(new URL(url))),
      content: "module.exports = 123;",
      exclude: createConfiguration("file:///w:/home").exclude,
      shallow: true,
      inline: false,
    },
  ],
);
