import { format } from "./format.mjs";

// check //

export const check =
  (Error) =>
  (boolean, template, ...values) => {
    if (!boolean) {
      throw new Error(format(template, values));
    }
  };

export const checkError = check(Error);

export const checkTypeError = check(TypeError);

// checkSuccess //

export const checkSuccess =
  (Error) =>
  (closure, template, ...values) => {
    try {
      return closure();
      /* c8 ignore start */
    } catch (error) {
      /* c8 ignore stop */
      throw new Error(format(template, [...values, error.message]));
    }
  };

export const checkSuccessError = checkSuccess(Error);

export const checkSuccessTypeError = checkSuccess(TypeError);

// checkDeadcode //

export const checkDeadcode =
  (Error) =>
  (template, ...values) =>
  (error) => {
    throw new Error(format(template, [...values, error.message]));
  };

export const checkDeadcodeError = checkDeadcode(Error);

export const checkDeadcodeTypeError = checkDeadcode(TypeError);
