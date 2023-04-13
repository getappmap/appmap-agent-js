import { defineGlobal } from "../../global/index.mjs";
import { assertDeepEqual } from "../../__fixture__.mjs";

defineGlobal("navigator", {
  userAgent: "name/version rest",
});

const { getEngine } = await import("./index.mjs");

assertDeepEqual(getEngine(), "name@version");
