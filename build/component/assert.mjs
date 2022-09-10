import { format } from "util";

const {Error} = globalThis;

export const assert = (boolean, template, ...rest) => {
  if (!boolean) {
    throw new Error(format(template, ...rest));
  }
};
