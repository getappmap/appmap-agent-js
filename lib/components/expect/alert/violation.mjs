const global_alert = alert;
const global_Error = Error;
const global_setTimeout = setTimeout;

const notifyViolation = (message) => {
  global_alert(
    `Something went wrong within the agent, the analysis is compromised and should be terminated (this is probably not a bug) >> ${message}`,
  );
  global_setTimeout(() => {
    throw new global_Error(`Timeout violation notification >> ${message}`);
  }, 0);
};

export const throwViolation = (message) => {
  notifyViolation(message);
  throw new global_Error(`Violation notification >> ${message}`);
};

export const throwViolationAsync = (message) => {
  notifyViolation(message);
  return Promise.reject(
    new global_Error(`Asynchronous violation notification >> ${message}`),
  );
};

export const catchViolation = (closure, recover) => closure();

export const catchViolationAsync = (promise, recover) => promise;
