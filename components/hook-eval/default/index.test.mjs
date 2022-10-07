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
        hooks: { eval: { hidden: "EVAL", aliases: ["eval"] } },
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
      assertEqual(evalGlobal(globalThis.EVAL("file:///foo", "123;")), 123);
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

assertEqual(evalGlobal(globalThis.EVAL("file:///foo", "123;")), 123);

assertDeepEqual(
  await testHookAsync(
    HookEval,
    {
      configuration: {
        hooks: { eval: false },
        packages: [],
      },
    },
    () => {},
  ),
  [],
);
