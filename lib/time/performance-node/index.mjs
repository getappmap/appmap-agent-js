import { performance } from "perf_hooks";

const { now } = performance;

export default (dependencies) => {
  return { now };
};
