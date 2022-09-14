import { assert } from "./assert.mjs";
import { print } from "./convert.mjs";

const {
  Error,
  String,
  JSON: { stringify: stringifyJSON },
} = globalThis;

export const format = (template, values) => {
  let index = 0;
  const { length } = values;
  const message = template.replace(
    /(%+)($|[^%])/gu,
    (_match, escape, marker) => {
      if (escape.length >= 2) {
        return `${escape.substring(1)}${marker}`;
      }
      assert(index < length, "missing format value");
      const value = values[index];
      index += 1;
      if (marker === "s") {
        assert(typeof value === "string", "expected a string for format");
        return value;
      }
      if (marker === "j") {
        return stringifyJSON(value);
      }
      if (marker === "O") {
        try {
          return String(value);
        } catch {
          return print(value);
        }
      }
      if (marker === "o") {
        return print(value);
      }
      throw new Error("invalid format marker");
    },
  );
  assert(index === length, "missing format marker");
  return message;
};
