import { format } from "./format.mjs";

// AppmapError is meant to indicate an unhappy path rather than a bug in the agent.
// Good candidates for AppmapError:
//   - invalid configuration file
//   - network failures

export class AppmapError extends Error {
  constructor(message) {
    super(message);
    this.name = "AppmapError";
  }
}

// const global_setTimeout = setTimeout;
// const createAppmapError = (message) => {
//   const error = new AppmapError(message);
//   global_setTimeout(() => {
//     throw new AppmapError(message);
//   });
//   if (typeof process !== "undefined") {
//     process.stderr.write(`${error.stack}${"\n"}`);
//     process.exit(123);
//   }
//   if (typeof alert !== "undefined") {
//     alsert(error.stack);
//   }
//   return error;
// };

export const expect = (boolean, template, ...values) => {
  if (!boolean) {
    throw new AppmapError(format(template, values));
  }
};

export const expectSuccess = (closure, template, ...rest) => {
  try {
    return closure();
  } catch (error) {
    throw new AppmapError(format(template, [...rest, error]));
  }
};

export const expectDeadcode =
  (template, ...rest1) =>
  (...rest2) => {
    throw new AppmapError(format(template, [...rest1, ...rest2]));
  };
