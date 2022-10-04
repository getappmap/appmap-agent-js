/* globals APPMAP_HOOK_EVAL */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_HOOK_EVAL"] */

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookEval from "./index.mjs?env=test";

const { eval: evalGlobal } = globalThis;

assertDeepEqual(
  await testHookAsync(
    HookEval,
    {
      configuration: {
        hooks: { eval: ["eval"] },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      url: "file:///base",
    },
    () => {
      assertEqual(evalGlobal(APPMAP_HOOK_EVAL("file:///foo", "123;")), 123);
    },
  ),
  [
    {
      type: "source",
      url: "file:///foo",
      content: "123;",
      shallow: true,
      exclude: createConfiguration("file:///home").exclude,
      inline: false,
    },
  ],
);

assertDeepEqual(
  await testHookAsync(
    HookEval,
    {
      configuration: {
        hooks: { eval: [] },
        packages: [],
      },
    },
    () => {
      assertEqual(evalGlobal(APPMAP_HOOK_EVAL("file:///foo", "123;")), 123);
    },
  ),
  [],
);
