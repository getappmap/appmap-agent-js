const { Error } = globalThis;

class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

export const assert = (boolean, message) => {
  if (!boolean) {
    throw new AssertionError(message);
  }
};

export const generateDeadcode = (message) => () => {
  throw new AssertionError(message);
};
