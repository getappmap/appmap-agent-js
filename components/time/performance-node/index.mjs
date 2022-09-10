import { performance } from "perf_hooks";

const { now } = performance;
const { round } = Math;

export default (_dependencies) => {
  return {
    now: () => round(1000 * now()) / 1000,
  };
};
