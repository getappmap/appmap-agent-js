import { format } from "util";

const _Error = Error;

export const assert = (boolean, template, ...rest) => {
  if (!boolean) {
    throw new _Error(format(template, ...rest));
  }
};
