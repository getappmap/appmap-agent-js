/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookEsm from "./index.mjs?env=test";

const { eval: evalGlobal } = globalThis;

assertDeepEqual(
  await testHookAsync(
    HookEsm,
    {
      configuration: {
        hooks: { esm: true },
        packages: [
          {
            regexp: "^",
            shallow: true,
          },
        ],
      },
      url: "file:///base",
    },
    async () => {
      globalThis.APPMAPuuid = {
        getFreshTab: () => 123,
      };
      // transformSource //
      {
        const { source } = await APPMAP_ESM_HOOK.transformSource(
          "123;",
          { url: "file:///foo", format: "module" },
          (content, _context, _next) => ({ source: content }),
        );
        assertEqual(evalGlobal(source), 123);
      }
      // load //
      {
        const { format, source } = await APPMAP_ESM_HOOK.load(
          "file:///bar",
          "context",
          (_url, _context, _next) => ({
            format: "module",
            source: "456;",
          }),
        );
        assertEqual(format, "module");
        assertEqual(evalGlobal(source), 456);
      }
      // bypass //
      {
        const { format, source } = await APPMAP_ESM_HOOK.load(
          "file:///qux",
          "context",
          (_url, _context, _next) => ({
            format: "custom",
            source: "789;",
          }),
        );
        assertEqual(format, "custom");
        assertEqual(evalGlobal(source), 789);
      }
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
    {
      type: "source",
      url: "file:///bar",
      content: "456;",
      shallow: true,
      exclude: createConfiguration("file:///home").exclude,
      inline: false,
    },
  ],
);

assertDeepEqual(
  await testHookAsync(
    HookEsm,
    {
      configuration: {
        hooks: { esm: false },
        packages: [],
      },
    },
    async () => {
      const { source } = await APPMAP_ESM_HOOK.transformSource(
        "123;",
        { url: "file:///foo", format: "module" },
        (content, _context, _next) => ({ source: content }),
      );
      assertEqual(evalGlobal(source), 123);
    },
  ),
  [],
);
