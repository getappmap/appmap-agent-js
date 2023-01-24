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
        evalGlobal(globalThis.EVAL("protocol://host/foo", "123-456", "789;")),
        789,
      );
    },
  ),
  [
    {
      type: "source",
      url: "protocol://host/foo/eval-123-456-uuid.js",
      content: "789;",
      shallow: true,
      exclude: createConfiguration("protocol://host/home").exclude,
      inline: false,
    },
  ],
);

assertEqual(
  evalGlobal(globalThis.EVAL("protocol://host/foo", "123-456", "789;")),
  789,
);

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
