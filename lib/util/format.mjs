import { print } from "./print.mjs";
import {assert} from "./basic/index.mjs";

export const format = (template, values) => {
  let index = -1;
  return template.replace(/(%+)($|[^%])/gu, (match, escape, marker) => {
    if (escape.length >= 2) {
      return `${escape.substring(1)}${marker}`;
    }
    index += 1;
    if (index < values.length) {
      if (marker === "s") {
        assert(typeof values[index] === "string", "expected a string");
      }
      if (marker === "e") {
        assert(values[index] instanceof global_Error, "expected an error");
        assert(typeof values[index].message === "string", "expected error.message to be a string");
        return values[index].message;
      }
      if (marker === "j") {
        return global_JSON_stringify(values[index]);
      }
      return print(values[index]);
    }
  });
};
