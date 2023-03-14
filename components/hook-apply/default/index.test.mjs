import { assertDeepEqual } from "../../__fixture__.mjs";
import { readGlobal } from "../../global/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import * as HookApply from "./index.mjs";

assertDeepEqual(
  await testHookAsync(
    HookApply,
    { configuration: { hooks: { apply: false } } },
    async () => {},
  ),
  [],
);

const summarize = ({ site, payload: { type } }) => `${site}/${type}`;

assertDeepEqual(
  (
    await testHookAsync(
      HookApply,
      { configuration: { hooks: { apply: "$" } } },
      () => {
        const runtime = readGlobal("$");
        {
          const tab = runtime.getFreshTab();
          runtime.recordApply(tab, "hash|protocol://host:0:0", "this", [
            "argument",
          ]);
          runtime.recordAwait(tab, "promise");
          runtime.recordResolve(tab, "result");
          runtime.recordReturn(tab, "hash|protocol://host:0:0", "result");
        }
        {
          const tab = runtime.getFreshTab();
          runtime.recordApply(tab, "hash|protocol://host:0:0", "this", [
            "argument",
          ]);
          runtime.recordAwait(tab, "promise");
          runtime.recordReject(tab, "error");
          runtime.recordThrow(tab, "hash|protocol://host:0:0", "error");
        }
        {
          const tab = runtime.getFreshTab();
          runtime.recordApply(tab, "hash|protocol://host:0:0", "this", [
            "argument",
          ]);
          runtime.recordYield(tab, "iterator");
          runtime.recordResolve(tab, "result");
          runtime.recordReturn(tab, "hash|protocol://host:0:0", "result");
        }
      },
    )
  ).map(summarize),
  [
    // tab1 //
    "begin/apply",
    "before/await",
    "after/resolve",
    "end/return",
    // tab2 //
    "begin/apply",
    "before/await",
    "after/reject",
    "end/throw",
    // tab3 //
    "begin/apply",
    "before/yield",
    "after/resolve",
    "end/return",
  ],
);
