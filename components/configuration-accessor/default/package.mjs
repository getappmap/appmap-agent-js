import { InternalAppmapError } from "../../error/index.mjs";

const { RegExp } = globalThis;

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

export const generateParseSource = (name) => {
  const regexps = [
    new RegExp(`^(?<before>${name})(?<after>($|\\s[\\s\\S]*$))`, "u"),
    new RegExp(`^(?<before>npx\\s+${name})(?<after>($|\\s[\\s\\S]*$))`, "u"),
    new RegExp(
      `^(?<before>npm\\s+exec\\s+mocha)(?<after>($|\\s[\\s\\S]*$))`,
      "u",
    ),
  ];
  return {
    canParseSource: (source) => regexps.some((regexp) => regexp.test(source)),
    parseSource: (source) => {
      for (const regexp of regexps) {
        const result = regexp.exec(source);
        if (result !== null) {
          return result.groups;
        }
      }
      throw new InternalAppmapError("could not parse command source");
    },
  };
};

export const generateSplitTokens = (name) => {
  const prefixes = [
    [name],
    ["npx", name],
    ["npx.cmd", name],
    ["npm", "exec", name],
    ["npm.cmd", "exec", name],
  ];
  return {
    canSplitTokens: (tokens) =>
      prefixes.some((prefix) => isPrefixArray(prefix, tokens)),
    splitTokens: (tokens) => {
      for (const prefix of prefixes) {
        if (isPrefixArray(prefix, tokens)) {
          return {
            __proto__: null,
            before: prefix,
            after: tokens.slice(prefix.length),
          };
        }
      }
      throw new InternalAppmapError("could not split command tokens");
    },
  };
};
