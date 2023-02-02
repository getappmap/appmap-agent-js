import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
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
            enabled: true,
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
      url: "protocol://host/foo/eval-123-456.js",
      content: "789;",
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
