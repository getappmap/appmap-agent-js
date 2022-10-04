import { assertDeepEqual } from "../../__fixture__.mjs";

globalThis.navigator = {
  userAgent: "name/version rest",
};

const { getEngine } = await import("./index.mjs?env=test");

assertDeepEqual(getEngine(), "name@version");
