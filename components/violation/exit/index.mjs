const {
  Reflect: { apply },
  Error,
  Promise,
  setTimeout,
  process: { exit, stderr },
  URL,
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { write } = stderr;

const signalViolation = (message) => {
  apply(write, stderr, [`${message}${"\n"}`]);
  exit(1);
  setTimeout(() => {
    throw new Error(`Timeout violation notification >> ${message}`);
  }, 0);
};

export const throwViolation = (message) => {
  signalViolation(message);
  throw new Error(`Violation notification >> ${message}`);
};

export const throwViolationAsync = (message) => {
  signalViolation(message);
  return Promise.reject(
    new Error(`Asynchronous violation notification >> ${message}`),
  );
};

export const catchViolation = (closure, _recover) => closure();

export const catchViolationAsync = (promise, _recover) => promise;
