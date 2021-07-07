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

export const expectSuccess0 = (closure, template, ... rest) => {
  try {
    closure();
  } catch (error) {
    throw new AppmapError(format(template, [... rest, error]));
  }
};

export const expectSuccess1 = (closure, argument1, template, ... rest) => {
  try {
    closure(argument0);
  } catch (error) {
    throw new AppmapError(format(template, [... rest, error]));
  }
};

export const expectSuccess2 = (closure, argument1, argument2, template, ... rest) => {
  try {
    closure(argument1, argument2);
  } catch (error) {
    throw new AppmapError(format(template, [... rest, error]));
  }
};

export const expectDeadcode = (template, ...rest1) => (...rest2) => {
  throw new AppmapError(format(template, [...rest1, ...rest2]));
};
