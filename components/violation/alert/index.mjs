/* eslint-env browser */

const { alert, Error, setTimeout, Promise } = globalThis;

export default (_dependencies) => {
  const notifyViolation = (message) => {
    alert(
      `Something went wrong within the agent, the analysis is compromised and should be terminated (this is probably not a bug) >> ${message}`,
    );
    setTimeout(() => {
      throw new Error(`Timeout violation notification >> ${message}`);
    }, 0);
  };

  return {
    throwViolation: (message) => {
      notifyViolation(message);
      throw new Error(`Violation notification >> ${message}`);
    },
    throwViolationAsync: (message) => {
      notifyViolation(message);
      return Promise.reject(
        new Error(`Asynchronous violation notification >> ${message}`),
      );
    },
    catchViolation: (closure, _recover) => closure(),
    catchViolationAsync: (promise, _recover) => promise,
  };
};
