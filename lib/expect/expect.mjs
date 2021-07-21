// Expection is meant to indicate an unhappy path rather than a bug in the agent.
// Good candidates for unexpected:
//   - invalid configuration file
//   - network failures

export default ({
    throwViolation,
    throwViolationAsync,
    catchViolation,
    catchViolationAsync,
  }) =>
  (dependencies) => {
    const {
      util: { format },
    } = dependencies;
    return {
      catchViolation,
      catchViolationAsync,
      expect: (boolean, template, ...values) => {
        if (!boolean) {
          throwViolation(format(template, values));
        }
      },
      expectDeadcode:
        (template, ...rest1) =>
        (...rest2) => {
          throwViolation(format(template, [...rest1, ...rest2]));
        },
      expectSuccess: (closure, template, ...rest) => {
        try {
          return closure();
        } catch (error) {
          throwViolation(format(template, [...rest, error]));
        }
      },
      expectSuccessAsync: (promise, template, ...rest) =>
        promise.catch((error) =>
          throwViolationAsync(format(template, [...rest, error])),
        ),
    };
  };
