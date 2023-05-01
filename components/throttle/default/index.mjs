const { Promise, setTimeout } = globalThis;

// export const createThrottle = ({
//   "throttle-threshold": threshold
//   "throttle-timeout-step": step,
// }) => ({
//   threshold,
//   step,
//   timeout: { value: 0 },
// });

export const createThrottle = ({}) => ({
  threshold: 10,
  step: 1000,
  buildup: { value: null },
  callbacks: [],
});

export const updateThrottle = ({ buildup, callbacks }, count) => {
  buildup.value = count;
  if (callbacks.length > 0) {
    for (const callback of callbacks) {
      callback();
    }
    callbacks.length = 0;
  }
};

export const throttleAsync = async ({
  threshold,
  buildup,
  step,
  callbacks,
}) => {
  // We want to wait for the first buildup from the backend.
  // Not doing so can still result in oom because the test
  // runner may be running a lot of test cases in the
  // meantime.
  if (buildup.value === null) {
    await new Promise((resolve) => {
      callbacks.push(resolve);
    });
  }
  if (buildup.value > threshold) {
    await new Promise((resolve) => {
      setTimeout(resolve, (buildup.value - threshold) * step);
    });
  }
};
