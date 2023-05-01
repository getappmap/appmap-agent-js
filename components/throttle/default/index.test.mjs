import { createThrottle, updateThrottle, throttleAsync } from "./index.mjs";

const { setTimeout } = globalThis;

const throttle = createThrottle({});

setTimeout(() => {
  updateThrottle(throttle, 11);
}, 0);

await throttleAsync(throttle);
