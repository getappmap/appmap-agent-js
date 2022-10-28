import { assertEqual } from "../../__fixture__.mjs";

globalThis.performance = { now: () => 0 };

const { now } = await import("./index.mjs?env=test");

assertEqual(typeof now(), "number");
