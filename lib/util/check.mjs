import { format } from "./format.mjs";

export const check =
  (Error) =>
  (boolean, template, ...values) => {
    if (!boolean) {
      throw new Error(format(template, values));
    }
  };

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

export const checkDeadcode =
  (Error) =>
  (template, ...values) =>
  (error) => {
    throw new Error(format(template, [...values, error.message]));
  };
