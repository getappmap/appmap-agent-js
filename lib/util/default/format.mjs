import { print } from "./print.mjs";
import { assert } from "./assert.mjs";

const global_Error = Error;
const global_JSON_stringify = JSON.stringify;

export const format = (template, values) => {
  let index = -1;
  return template.replace(/(%+)($|[^%])/gu, (match, escape, marker) => {
    if (escape.length >= 2) {
      return `${escape.substring(1)}${marker}`;
    }
    index += 1;
    if (index < values.length) {
      const value = values[index];
      if (marker === "s") {
        assert(typeof value === "string", "expected a string");
        return value;
      }
      if (marker === "e") {
        assert(value instanceof global_Error, "expected an error");
        assert(
          typeof value.message === "string",
          "expected error.message to be a string",
        );
        return value.message;
      }
      if (marker === "j") {
        return global_JSON_stringify(value);
      }
      assert(marker === "o", "invalid marker");
      return print(value);
    }
  });
};
