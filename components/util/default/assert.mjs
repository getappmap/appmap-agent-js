/* c8 ignore start */

const { Error } = globalThis;

export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

export const assert = (boolean, message, Constructor) => {
  if (!boolean) {
    throw new Constructor(message);
  }
};

export const generateDeadcode = (message, Constructor) => () => {
  throw new Constructor(message);
};
