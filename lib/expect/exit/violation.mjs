const { apply: global_Reflect_apply } = Reflect;
const global_Error = Error;
const global_setTimeout = setTimeout;
const { exit: global_process_exit, stderr: global_process_stderr } = process;
const { write: global_process_stderr_write } = global_process_stderr;

const signalViolation = (message) => {
  global_Reflect_apply(global_process_stderr_write, global_process_stderr, [
    `${message}${"\n"}`,
  ]);
  global_process_exit(1);
  global_setTimeout(() => {
    throw new global_Error(`Timeout violation notification >> ${message}`);
  }, 0);
};

export const throwViolation = (message) => {
  signalViolation(message);
  throw new global_Error(`Violation notification >> ${message}`);
};

export const throwViolationAsync = (message) => {
  signalViolation(message);
  return Promise.reject(
    new global_Error(`Asynchronous violation notification >> ${message}`),
  );
};

export const catchViolation = (closure, recover) => closure();

export const catchViolationAsync = (promise, recover) => promise;
