/* eslint-env browser */

const _alert = alert;
const _Error = Error;
const _setTimeout = setTimeout;
const _Promise = Promise;

export default (_dependencies) => {
  const notifyViolation = (message) => {
    _alert(
      `Something went wrong within the agent, the analysis is compromised and should be terminated (this is probably not a bug) >> ${message}`,
    );
    _setTimeout(() => {
      throw new _Error(`Timeout violation notification >> ${message}`);
    }, 0);
  };

  return {
    throwViolation: (message) => {
      notifyViolation(message);
      throw new _Error(`Violation notification >> ${message}`);
    },
    throwViolationAsync: (message) => {
      notifyViolation(message);
      return _Promise.reject(
        new _Error(`Asynchronous violation notification >> ${message}`),
      );
    },
    catchViolation: (closure, _recover) => closure(),
    catchViolationAsync: (promise, _recover) => promise,
  };
};
