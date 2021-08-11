import { format } from "util";

export const assert = (boolean, template, ...rest) => {
  if (!boolean) {
    throw new Error(format(template, ...rest));
  }
};
