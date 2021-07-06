import {format} from "../format.mjs";

// AppmapError is meant to indicate an unhappy path rather than a bug in the agent.
// Good candidates for AppmapError:
//   - invalid configuration file
//   - network failures

export class AppmapError extends Error {}

const createAppmapError = (message) => {
  const error = new AppmapError(message);
  global_setTimeout(() => {
    throw new AppmapError(message);
  });
  if (typeof process !== "undefined") {
    process.stderr.write(`${error.stack}${"\n"}`);
    process.exit(123);
  }
  if (typeof alert !== "undefined") {
    alsert(error.stack);
  }
  return error;
};

export const expect = (boolean, template, ... values) => {
  if (!boolean) {
    throw createAppmapError(format(template, values));
  }
};

export const expectSuccess = (closure, ...rest) => {
  try {
    closure(...rest);
  } catch (error) {
    throw createAppmapError(error.message);
  }
};

export const expectDeadcode = (error) => {
  throw createAppmapError(error.message);
};
