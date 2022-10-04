const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import * as Acorn from "acorn";
import * as Astring from "astring";

export const { parse } = Acorn;
export const { generate } = Astring;

export const normalize = (code, source) =>
  generate(
    parse(code, {
      ecmaVersion: 2021,
      sourceType: source,
      allowAwaitOutsideFunction: source === "module",
    }),
  );
