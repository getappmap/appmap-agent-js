import { hooks } from "../../../lib/node/loader-esm.mjs";
import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookEsm from "./esm.mjs";

const { eval: evalGlobal } = globalThis;

assertDeepEqual(
  await testHookAsync(
    HookEsm,
    {
      configuration: {
        hooks: { apply: false, esm: true },
        packages: [
          {
            regexp: "^",
            enabled: true,
          },
        ],
      },
      url: "protocol://host/base",
    },
    async () => {
      // transformSource //
      {
        const { source } = await hooks.transformSource(
          "123;",
          { url: "protocol://host/foo", format: "module" },
          (content, _context, _next) => ({ source: content }),
        );
        assertEqual(evalGlobal(source), 123);
      }
      // load //
      {
        const { format, source } = await hooks.load(
          "protocol://host/bar",
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
        const { format, source } = await hooks.load(
          "protocol://host/qux",
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
      url: "protocol://host/foo",
      content: "123;",
    },
    {
      type: "source",
      url: "protocol://host/bar",
      content: "456;",
    },
  ],
);
