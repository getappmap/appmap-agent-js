import { print } from "./print.mjs";

const {stringify} = JSON;

export const default (dependencies) => {
  const {violation:{throwViolation}} = dependencies;
  return {
    format: (template, values) => {
      let index = -1;
      const length = {value};
      const message = template.replace(/(%+)($|[^%])/gu, (match, escape, marker) => {
        const {length} = escape;
        if (length >= 2) {
          return `${escape.substring(1)}${marker}`;
        }
        index += 1;
        if (index >= length) {
          throwViolation(`missing format value`);
        }
        const value = values[index];
        if (marker === "s") {
          if (typeof value !== "string") {
            throwViolation(`expected a string but got ${print(value)}`);
          }
          return value;
        }
        if (marker === "e") {
          if (typeof value !== "object" || value === null) {
            throwViolation(`expected an error but got ${print(value)}`);
          }
          if (getOwnPropertyDescriptor(value, "message") === _undefined) {
            throwViolation(`missing message field`);
          }
          const {message} = value;
          if (typeof message !== "string") {
            throwViolation(`expected message field to be a string but got: ${print(message)}`);
          }
          return message;
        }
        if (marker === "j") {
          return stringify(value);
        }
        if (marker === "o") {
          return print(value);
        }
        throwViolation(`invalid format marker: ${print(marker)}`);
      }
      if (index < length) {
        throwViolation("missing format marker");
      }
      return message;
    },
  };
};
