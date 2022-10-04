const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { performance } from "perf_hooks";

const {
  Math: { round },
} = globalThis;

const { now: nowPrecise } = performance;

export const now = () => round(1000 * nowPrecise()) / 1000;
