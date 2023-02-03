const { Error } = globalThis;

export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

export const assert = (check, message, Constructor) => {
  if (typeof check !== "boolean") {
    throw new Error("expected assertion check to be a boolean");
  }
  if (typeof message !== "string") {
    throw new Error("expected assertion message to be a string");
  }
  if (typeof Constructor !== "function") {
    throw new Error("expected assertion constructor to be a function");
  }
  if (!check) {
    throw new Constructor(message);
  }
};

export const generateDeadcode = (message, Constructor) => {
  if (typeof message !== "string") {
    throw new Error("expected deadcode message to be a string");
  }
  if (typeof Constructor !== "function") {
    throw new Error("expected deadcode constructor to be a function");
  }
  return () => {
    throw new Constructor(message);
  };
};
