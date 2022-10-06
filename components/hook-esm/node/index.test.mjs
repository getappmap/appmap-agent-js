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
        hooks: { esm: "GLOBAL" },
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
        const { source } = await globalThis.GLOBAL.transformSource(
          "123;",
          { url: "file:///foo", format: "module" },
          (content, _context, _next) => ({ source: content }),
        );
        assertEqual(evalGlobal(source), 123);
      }
      // load //
      {
        const { format, source } = await globalThis.GLOBAL.load(
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
        const { format, source } = await globalThis.GLOBAL.load(
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
