/* globals APPMAP_ESM_HOOK */
/* eslint local/no-globals: ["error", "globalThis", "APPMAP_ESM_HOOK"] */

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookESM from "./index.mjs";

const { eval: evalGlobal } = globalThis;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const { createConfiguration } = await buildTestComponentAsync("configuration");
const component = HookESM(dependencies);

assertDeepEqual(
  await testHookAsync(
    component,
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
          async (content, _context, _next) => ({ source: content }),
        );
        assertEqual(evalGlobal(source), 123);
      }
      // load //
      {
        const { format, source } = await APPMAP_ESM_HOOK.load(
          "file:///bar",
          "context",
          async (_url, _context, _next) => ({
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
          async (_url, _context, _next) => ({
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
    component,
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
        async (content, _context, _next) => ({ source: content }),
      );
      assertEqual(evalGlobal(source), 123);
    },
  ),
  [],
);
