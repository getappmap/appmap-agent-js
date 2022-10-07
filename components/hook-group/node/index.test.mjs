import { assertDeepEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs?env=test";
import * as HookGroup from "./index.mjs?env=test";

const { Promise, setTimeout } = globalThis;

assertDeepEqual(
  await testHookAsync(
    HookGroup,
    { configuration: { ordering: "chronological" } },
    async () => {
      await new Promise((resolve) => {
        setTimeout(resolve);
      });
    },
  ),
  [],
);

// provide an unknown async id
setTimeout(() => {}, 100);

await testHookAsync(
  HookGroup,
  { configuration: { ordering: "causal" } },
  async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  },
);
