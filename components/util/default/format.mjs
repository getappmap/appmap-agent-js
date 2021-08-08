import { assert } from "./assert.mjs";
import { print } from "./print.mjs";

const { getOwnPropertyDescriptor } = Reflect;
const _undefined = undefined;
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
      if (marker === "e") {
        assert(
          typeof value === "object" && value !== null,
          "expected an object",
        );
        const descriptor = getOwnPropertyDescriptor(value, "message");
        assert(descriptor !== _undefined, "missing 'message' property");
        assert(
          getOwnPropertyDescriptor(descriptor, "value") !== _undefined,
          "'message' property is an accessor",
        );
        const { value: message } = descriptor;
        assert(
          typeof message === "string",
          "expected 'message' property value to be a string",
        );
        return message;
      }
      if (marker === "j") {
        return stringify(value);
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
