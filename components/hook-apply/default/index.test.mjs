import { assertDeepEqual } from "../../__fixture__.mjs";
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
        {
          const tab = globalThis.$.getFreshTab();
          globalThis.$.recordApply(tab, "function", "this", ["argument"]);
          globalThis.$.recordAwait(tab, "promise");
          globalThis.$.recordResolve(tab, "result");
          globalThis.$.recordReturn(tab, "function", "result");
        }
        {
          const tab = globalThis.$.getFreshTab();
          globalThis.$.recordApply(tab, "function", "this", ["argument"]);
          globalThis.$.recordAwait(tab, "promise");
          globalThis.$.recordReject(tab, "error");
          globalThis.$.recordThrow(tab, "function", "error");
        }
        {
          const tab = globalThis.$.getFreshTab();
          globalThis.$.recordApply(tab, "function", "this", ["argument"]);
          globalThis.$.recordYield(tab, "iterator");
          globalThis.$.recordResume(tab);
          globalThis.$.recordReturn(tab, "function", "result");
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
    "after/resume",
    "end/return",
  ],
);
