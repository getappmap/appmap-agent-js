const { URL, alert, Error, setTimeout, Promise } = globalThis;

const { search: __search } = new URL(import.meta.url);

const notifyViolation = (message) => {
  alert(
    `Something went wrong within the agent, the analysis is compromised and should be terminated (this is probably not a bug) >> ${message}`,
  );
  setTimeout(() => {
    throw new Error(`Timeout violation notification >> ${message}`);
  }, 0);
};

export const throwViolation = (message) => {
  notifyViolation(message);
  throw new Error(`Violation notification >> ${message}`);
};

export const throwViolationAsync = (message) => {
  notifyViolation(message);
  return Promise.reject(
    new Error(`Asynchronous violation notification >> ${message}`),
  );
};

export const catchViolation = (closure, _recover) => closure();

export const catchViolationAsync = (promise, _recover) => promise;
