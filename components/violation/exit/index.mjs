const {
  Reflect: { apply },
  Error,
  Promise,
  setTimeout,
  process: { exit, stderr },
} = globalThis;

const { write } = stderr;

export default (_dependencies) => {
  const signalViolation = (message) => {
    apply(write, stderr, [`${message}${"\n"}`]);
    exit(1);
    setTimeout(() => {
      throw new Error(`Timeout violation notification >> ${message}`);
    }, 0);
  };
  return {
    throwViolation: (message) => {
      signalViolation(message);
      throw new Error(`Violation notification >> ${message}`);
    },
    throwViolationAsync: (message) => {
      signalViolation(message);
      return Promise.reject(
        new Error(`Asynchronous violation notification >> ${message}`),
      );
    },
    catchViolation: (closure, _recover) => closure(),
    catchViolationAsync: (promise, _recover) => promise,
  };
};
