/* globals $uuid */
/* eslint local/no-globals: ["error", "$uuid"] */

import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookApply from "./index.mjs?env=test";

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
      { configuration: { hooks: { apply: true }, "hidden-identifier": "$" } },
      () => {
        {
          const tab = $uuid.getFreshTab();
          $uuid.recordApply(tab, "function", "this", ["argument"]);
          $uuid.recordAwait(tab, "promise");
          $uuid.recordResolve(tab, "result");
          $uuid.recordReturn(tab, "function", "result");
        }
        {
          const tab = $uuid.getFreshTab();
          $uuid.recordApply(tab, "function", "this", ["argument"]);
          $uuid.recordAwait(tab, "promise");
          $uuid.recordReject(tab, "error");
          $uuid.recordThrow(tab, "function", "error");
        }
        {
          const tab = $uuid.getFreshTab();
          $uuid.recordApply(tab, "function", "this", ["argument"]);
          $uuid.recordYield(tab, "iterator");
          $uuid.recordResume(tab);
          $uuid.recordReturn(tab, "function", "result");
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
