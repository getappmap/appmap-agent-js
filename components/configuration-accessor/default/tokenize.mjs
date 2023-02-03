import { assert } from "../../util/index.mjs";

import { ExternalAppmapError } from "../../error/index.mjs";

import { logErrorWhen } from "../../log/index.mjs";

const space = /^\s$/u;

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
    "unterminated quote on command",
    ExternalAppmapError,
  );
  assert(
    !logErrorWhen(escaped, "missing escaped character on command %s", source),
    "missing escaped character",
    ExternalAppmapError,
  );
  return tokens;
};

// https://github.com/nodejs/node/blob/e58ed6d855e1af6579aaa50471426db8881eea99/lib/child_process.js#L628
export const tokenize = (source, shell) => {
  if (shell === null) {
    return tokenizeShell(source);
  } else if (/^(?:.*\\)?cmd(?:\.exe)?$/iu.test(shell)) {
    return [shell, "/d", "/s", "/c", `"${source}"`];
  } else {
    return [shell, "-c", source];
  }
};
