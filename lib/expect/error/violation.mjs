class AppmapError extends Error {
  constructor(message) {
    super(message);
    this.name = "AppmapError";
  }
}

export const throwViolation = (message) => {
  throw new AppmapError(message);
};

export const throwViolationAsync = (message) =>
  Promise.reject(new AppmapError(message));

export const catchViolation = (closure, recover) => {
  try {
    return closure();
  } catch (error) {
    if (error instanceof AppmapError) {
      return recover(error.message);
    }
    throw error;
  }
};

export const catchViolationAsync = (promise, recover) =>
  promise.catch((error) => {
    if (error instanceof AppmapError) {
      return recover(error.message);
    }
    return Promise.reject(error);
  });
