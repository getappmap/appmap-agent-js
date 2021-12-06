/* eslint-env node */

import { performance } from "perf_hooks";
import { strict as Assert } from "assert";

const { equal: assertEqual } = Assert;

global.performance = performance;
const { default: Time } = await import("./index.mjs");
const { now } = Time({});
assertEqual(typeof now(), "number");