import { assert } from "./assert.mjs";
import { print } from "./print.mjs";

const _String = String;
const { stringify } = JSON;

export const format = (template, values) => {
  let index = 0;
  const { length } = values;
  const message = template.replace(
    /(%+)($|[^%])/gu,
    (match, escape, marker) => {
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
        return stringify(value);
      }
      if (marker === "O") {
        try {
          return _String(value);
        } catch {
          return print(value);
        }
      }
      if (marker === "o") {
        return print(value);
      }
      assert(false, "invalid format marker");
    },
  );
  assert(index === length, "missing format marker");
  return message;
};
