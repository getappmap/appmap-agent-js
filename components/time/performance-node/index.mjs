const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { performance } from "perf_hooks";

const {
  Math: { round },
} = globalThis;

export const now = () => round(1000 * performance.now()) / 1000;
