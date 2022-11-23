import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookEval from "./index.mjs";

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
      url: "protocol://host/base",
    },
    () => {
      assertEqual(
        evalGlobal(globalThis.EVAL("protocol://host/foo", "123;")),
        123,
      );
    },
  ),
  [
    {
      type: "source",
      url: "protocol://host/foo",
      content: "123;",
      shallow: true,
      exclude: createConfiguration("protocol://host/home").exclude,
      inline: false,
    },
  ],
);

assertEqual(evalGlobal(globalThis.EVAL("protocol://host/foo", "123;")), 123);

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
