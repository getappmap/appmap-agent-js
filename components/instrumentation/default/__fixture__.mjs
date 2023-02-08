import BabelParser from "@babel/parser";
import * as Astring from "astring";

export const { generate } = Astring;
const { parse: parseBabel } = BabelParser;

export const normalize = (code, source) =>
  generate(
    parseBabel(code, {
      ecmaVersion: 2021,
      sourceType: source,
      allowAwaitOutsideFunction: source === "module",
      plugins: ["estree"],
    }).program,
  );
