import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { defineGlobal } from "../../global/index.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";

const window = {
  onBeforeUnload: null,
  addEventListener(name, listener) {
    assertEqual(name, "beforeunload");
    assertEqual(this.onBeforeUnload, null);
    this.onBeforeUnload = listener;
  },
  removeEventListener(name, listener) {
    assertEqual(name, "beforeunload");
    assertEqual(this.onBeforeUnload, listener);
    this.onBeforeUnload = null;
  },
};

defineGlobal("window", window);

assertDeepEqual(
  await testHookAsync(await import("./index.mjs"), {}, () => {
    window.onBeforeUnload();
  }),
  [
    {
      type: "stop",
      track: null,
      termination: { type: "exit", status: 0 },
    },
  ],
);
