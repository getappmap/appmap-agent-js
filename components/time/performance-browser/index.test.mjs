/* eslint-env node */

import { performance } from "perf_hooks";
import { assertEqual } from "../../__fixture__.mjs";

globalThis.performance = performance;
const { default: Time } = await import("./index.mjs");
const { now } = Time({});
assertEqual(typeof now(), "number");
