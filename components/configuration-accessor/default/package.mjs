import { assert } from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";

const isPrefixArray = (prefix, array) => {
  const { length } = prefix;
  if (length > array.length) {
    return false;
  } else {
    for (let index = 0; index < length; index += 1) {
      if (prefix[index] !== array[index]) {
        return false;
      }
    }
    return true;
  }
};

const findScriptIndex = (tokens, index) => {
  if (index < tokens.length) {
    const token = tokens[index];
    // In the node cli, `-` indicates that the script
    // is read from the stdin. In that case, we should
    // not return any index. For instance:
    // `node - foo.js`
    if (token === "-") {
      return null;
      // In the CLI of node, npm and npx: `--` indicates
      // the the script argument is following.
    } else if (token === "--") {
      return index + 1 < tokens.length ? index + 1 : null;
      // We only support named argument of the form
      // `--foo=bar` and not `--foo bar`.
    } else if (token.startsWith("-")) {
      return findScriptIndex(tokens, index + 1);
    } else {
      return index;
    }
  } else {
    return null;
  }
};

const executables = [
  ["node"],
  ["npm", "exec"],
  ["npm", "x"],
  ["npx"],
  ["npm.cmd", "exec"],
  ["npm.cmd", "x"],
  ["npx.cmd"],
  [],
];

export const splitTokens = (tokens) => {
  const executable = executables.find((executable) =>
    isPrefixArray(executable, tokens),
  );
  const positional = findScriptIndex(tokens, executable.length);
  assert(
    !logErrorWhen(
      positional === null,
      "could not parse and hook command because of missing positional argument, got %j",
      tokens,
    ),
    "could not parse and hook command",
    ExternalAppmapError,
  );
  return {
    __proto__: null,
    exec: tokens.slice(0, positional + 1),
    argv: tokens.slice(positional + 1),
  };
};

export const sniffTokens = (tokens, name) => {
  const executable = executables.find((executable) =>
    isPrefixArray(executable, tokens),
  );
  const positional = findScriptIndex(tokens, executable.length);
  return positional !== null && tokens[positional].includes(name);
};
