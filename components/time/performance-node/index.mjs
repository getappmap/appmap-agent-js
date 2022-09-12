import { performance } from "perf_hooks";

const {
  Math: { round },
} = globalThis;

const { now } = performance;

export default (_dependencies) => ({
  now: () => round(1000 * now()) / 1000,
});
