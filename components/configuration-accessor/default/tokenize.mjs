import { assert } from "../../util/index.mjs";

import { ExternalAppmapError } from "../../error/index.mjs";

import { logErrorWhen } from "../../log/index.mjs";

const space = /^\s$/u;

export const tokenizeCmdShell = (source) => {
  const tokens = [];
  let token = "";
  let escaped = false;
  let quoted = false;
  for (const char of source) {
    token += char;
    if (quoted) {
      if (char === '"') {
        quoted = false;
      }
    } else if (escaped) {
      escaped = false;
    } else if (char === "^") {
      escaped = true;
    } else if (char === '"') {
      quoted = true;
    } else if (space.test(char)) {
      if (token.length > 1) {
        tokens.push(token.substring(0, token.length - 1));
      }
      token = "";
    }
  }
  if (token !== "") {
    tokens.push(token);
  }
  assert(
    !logErrorWhen(quoted, "unterminated quote on command %s", source),
    ExternalAppmapError,
    "unterminated quote on command",
  );
  assert(
    !logErrorWhen(escaped, "missing escaped character on command %s", source),
    ExternalAppmapError,
    "missing escaped character",
  );
  return tokens;
};

export const tokenizeShell = (source) => {
  const tokens = [];
  let token = "";
  let escaped = false;
  let quote = null;
  for (const char of source) {
    token += char;
    if (quote === "'") {
      if (char === "'") {
        quote = null;
      }
    } else if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (quote === '"') {
      if (char === '"') {
        quote = null;
      }
    } else if (space.test(char)) {
      if (token.length > 1) {
        tokens.push(token.substring(0, token.length - 1));
      }
      token = "";
    } else if (char === '"' || char === "'") {
      quote = char;
    }
  }
  if (token !== "") {
    tokens.push(token);
  }
  assert(
    !logErrorWhen(quote !== null, "unterminated quote on command %s", source),
    ExternalAppmapError,
    "unterminated quote on command",
  );
  assert(
    !logErrorWhen(escaped, "missing escaped character on command %s", source),
    ExternalAppmapError,
    "missing escaped character",
  );
  return tokens;
};
