import { format } from "./format.mjs";

// Expection is meant to indicate an unhappy path rather than a bug in the agent.
// Good candidates for unexpected:
//   - invalid configuration file
//   - network failures

export default (dependencies) => {
  const {Violation:{throwViolation, throwUnexpectationAsync, catchUnexpectation, catchUnexpectation}} = dependencies;
  return {
    catchViolation,
    catchViolationAsync,
    expect: (boolean, template, ...values) => {
      if (!boolean) {
        throwUnexpectation(format(template, values));
      }
    },
    expectDeadcode: (template, ...rest1) => (...rest2) => {
      throwUnexpectation(format(template, [...rest1, ...rest2]));
    },
    expectSuccess: (closure, template, ...rest) => {
      try {
        return closure();
      } catch (error) {
        throwUnexpectation(format(template, [...rest, error]));
      }
    },
    expectSuccessAsync: (promise, template, ...rest) => promise.catch((error) => throwUnexpectationAsync(
      format(template, [...rest1, error])
    }));
  };
};



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
