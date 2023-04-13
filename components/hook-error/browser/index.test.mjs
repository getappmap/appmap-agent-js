import { assertEqual } from "../../__fixture__.mjs";
import { testHookAsync } from "../../hook-fixture/index.mjs";
import { defineGlobal } from "../../global/index.mjs";

const { Error } = globalThis;

const window = {
  onError: null,
  addEventListener(name, listener) {
    assertEqual(name, "error");
    this.onError = listener;
  },
  removeEventListener(name, listener) {
    assertEqual(name, "error");
    assertEqual(this.onError, listener);
    this.onError = null;
  },
};

defineGlobal("window", window);

assertEqual(
  (
    await testHookAsync(await import("./index.mjs"), {}, () => {
      window.onError(new Error("message"));
    })
  )[0].error.specific.message,
  "message",
);
