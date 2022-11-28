import { assert } from "../../util/index.mjs";
import {
  InternalAppmapError,
  ExternalAppmapError,
} from "../../error/index.mjs";
import { getShell } from "../../path/index.mjs";

// NODE_OPTIONS format is not platform-specific
// It is also not well documented but it seems to only require whitespace escaping.
// - https://github.com/nodejs/node/issues/12971
// - https://github.com/nodejs/node/commit/2eb627301c1f6681ec51f43b84e37f3908514853
// - https://nodejs.org/api/cli.html#node_optionsoptions
// - https://github.com/nodejs/node/blob/80270994d6ba6019a6a74adc1b97a0cc1bd343ed/src/node_options.cc
export const escapeNodeOption = (token) => {
  assert(
    !token.includes(" "),
    "spaces should have been percent-encoded",
    InternalAppmapError,
  );
  return token;
};

const escapePosix = (token) => token.replace(/[^a-zA-Z0-9\-_./:]/gu, "\\$&");

// https://ss64.com/nt/syntax-esc.html
const escapeWin32 = (token) => token.replace(/[^a-zA-Z0-9\-_./:\\]/gu, "^$&");

export const resolveShell = (shell, env) => {
  if (shell === false) {
    return null;
  } else if (shell === true) {
    return getShell(env);
  } else {
    return shell;
  }
};

export const escapeShell = (shell, token) => {
  if (typeof shell === "string") {
    if (shell.endsWith("cmd") || shell.endsWith("cmd.exe")) {
      return escapeWin32(token);
    } else {
      return escapePosix(token);
    }
  } else {
    throw new ExternalAppmapError(
      "Could not escape token because no shell was provided",
    );
  }
};
