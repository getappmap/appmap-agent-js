
class AppmapError extends Error {
  constructor (message) {
    super(message);
    this.name = "AppmapError";
  }
}

const throwViolation = (message) => {
  throw new AppmapError(message);
};

const throwViolationAsync = (message) => Promise.reject(new AppmapError(message));

const catchViolation = (closure, recover) => {
  try {
    return closure();
  } catch (error) {
    if (error instanceof AppmapError) {
      return recover(error.message);
    }
  }
};

const catchViolationAsync = (promise, recover) => promise.catch((error) => {
  if (error instanceof AppmapError) {
    return recover(error.message);
  }
  return Promise.reject(error);
});

export default (dependency) => ({
  throwViolation,
  rejectViolation,
  catchViolation,
  catchViolationAsync,
});
