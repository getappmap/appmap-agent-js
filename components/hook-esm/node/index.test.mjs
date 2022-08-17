/* globals APPMAP_ESM_HOOK */

import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import HookESM from "./index.mjs";

const _eval = eval;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { testHookAsync } = await buildTestComponentAsync("hook-fixture");
const { createConfiguration } = await buildTestComponentAsync("configuration");
const component = HookESM(dependencies);

assertDeepEqual(
  await testHookAsync(
    component,
    {
      hooks: { esm: true },
      packages: [
        {
          regexp: "^",
          shallow: true,
        },
      ],
    },
    async () => {
      // transformSource //
      {
        const { source } = await APPMAP_ESM_HOOK.transformSource(
          "123;",
          { url: "file:///foo", format: "module" },
          async (content, context, next) => ({ source: content }),
        );
        assertEqual(_eval(source), 123);
      }
      // load //
      {
        const { format, source } = await APPMAP_ESM_HOOK.load(
          "file:///bar",
          "context",
          async (url, context, next) => ({ format: "module", source: "456;" }),
        );
        assertEqual(format, "module");
        assertEqual(_eval(source), 456);
      }
      // bypass //
      {
        const { format, source } = await APPMAP_ESM_HOOK.load(
          "file:///qux",
          "context",
          async (url, context, next) => ({ format: "custom", source: "789;" }),
        );
        assertEqual(format, "custom");
        assertEqual(_eval(source), 789);
      }
    },
  ),
  {
    sources: [
      {
        url: "file:///foo",
        content: "123;",
        shallow: true,
        exclude: createConfiguration("file:///home").exclude,
        inline: false,
      },
      {
        url: "file:///bar",
        content: "456;",
        shallow: true,
        exclude: createConfiguration("file:///home").exclude,
        inline: false,
      },
    ],
    events: [],
  },
);

assertDeepEqual(
  await testHookAsync(
    component,
    {
      hooks: { esm: false },
      packages: [],
    },
    async () => {
      const { source } = await APPMAP_ESM_HOOK.transformSource(
        "123;",
        { url: "file:///foo", format: "module" },
        async (content, context, next) => ({ source: content }),
      );
      assertEqual(_eval(source), 123);
    },
  ),
  {
    sources: [],
    events: [],
  },
);
