import { format } from "util";

const { stderr, exit } = process;

export const expect = (boolean, template, ...rest) => {
  if (!boolean) {
    stderr.write(`${format(template, ...rest)}${"\n"}`);
    /* c8 ignore start */
    if ("EXPECT_TEST" in global) {
      throw new Error("Expection failure");
    } else {
      exit(1);
    }
    /* c8 ignore stop */
  }
};
