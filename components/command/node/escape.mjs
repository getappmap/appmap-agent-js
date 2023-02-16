import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
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

export const resolveShell = (shell, env) => {
  if (shell === false) {
    return null;
  } else if (shell === true) {
    return getShell(env);
  } else {
    return shell;
  }
};
