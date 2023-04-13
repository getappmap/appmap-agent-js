import { assertEqual } from "../../__fixture__.mjs";
import { defineGlobal } from "../../global/index.mjs";

defineGlobal("performance", { now: () => 0 });

const { now } = await import("./index.mjs");

assertEqual(typeof now(), "number");
