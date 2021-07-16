
const global_alert = alert;
const global_Error = Error;
const global_setTimeout = setTimeout;

const notifyViolation = (message) => {
  alert(`Something went wrong within the agent, the analysis is compromised and should be terminated (this is probably not a bug) >> ${message}`);
  global_setTimeout(() => {
    throw new global_Error(`Timeout violation notification >> ${message}`);
  }, 0);
}

const throwViolation = (message) => {
  notifyViolation(message);
  throw new global_Error(`Violation notification >> ${message}`);
};

const rejectViolation = (message) => {
  notifyViolation(message);
  return Promise.reject(`Asynchronous violation notification >> ${message}`);
};

const catchViolation = (closure, recover) => closure();

export const catchViolationAsync = (promise, recover) => promise;

export default (dependencies) => ({
  throwViolation,
  rejectViolation,
  catchViolation,
  catchViolationAsync,
});
