const _Error = Error;
const _Promise = Promise;

export default (_dependencies) => {
  class AppmapError extends _Error {
    constructor(message) {
      super(message);
      this.name = "AppmapError";
    }
  }

  return {
    throwViolation: (message) => {
      throw new AppmapError(message);
    },
    throwViolationAsync: (message) => _Promise.reject(new AppmapError(message)),
    catchViolation: (closure, recover) => {
      try {
        return closure();
      } catch (error) {
        if (error instanceof AppmapError) {
          const { message } = error;
          return recover(message);
        }
        throw error;
      }
    },
    catchViolationAsync: (promise, recover) =>
      promise.catch((error) => {
        if (error instanceof AppmapError) {
          const { message } = error;
          return recover(message);
        }
        return Promise.reject(error);
      }),
  };
};
