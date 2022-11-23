import { assertEqual } from "../../__fixture__.mjs";

globalThis.performance = { now: () => 0 };

const { now } = await import("./index.mjs");

assertEqual(typeof now(), "number");
