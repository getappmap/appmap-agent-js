const { apply } = Reflect;
const _Error = Error;
const _setTimeout = setTimeout;
const { exit, stderr } = process;
const { write } = stderr;

export default (dependencies) => {
  const signalViolation = (message) => {
    apply(write, stderr, [`${message}${"\n"}`]);
    exit(1);
    _setTimeout(() => {
      throw new _Error(`Timeout violation notification >> ${message}`);
    }, 0);
  };

  return {
    throwViolation: (message) => {
      signalViolation(message);
      throw new _Error(`Violation notification >> ${message}`);
    },
    throwViolationAsync: (message) => {
      signalViolation(message);
      return Promise.reject(
        new _Error(`Asynchronous violation notification >> ${message}`),
      );
    },
    catchViolation: (closure, recover) => closure(),
    catchViolationAsync: (promise, recover) => promise,
  };
};
