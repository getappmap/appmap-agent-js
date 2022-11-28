import { coalesce } from "../../util/index.mjs";
import { logError } from "../../log/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { isPrefixArray } from "./util.mjs";
import { escapeShell, escapeNodeOption } from "./escape.mjs";

const mocha_regexp_array = [
  /^(?<before>mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npx\s+mocha)(?<after>($|\s[\s\S]*$))/u,
  /^(?<before>npm\s+exec\s+mocha)(?<after>($|\s[\s\S]*$))/u,
];

const mocha_prefix_array = [
  ["mocha"],
  ["npx", "mocha"],
  ["npm", "exec", "mocha"],
];

const parseMochaSource = (source) => {
  for (const regexp of mocha_regexp_array) {
    const result = regexp.exec(source);
    if (result !== null) {
      return result.groups;
    }
  }
  logError("Could not parse %j as a mocha command", source);
  throw new ExternalAppmapError("Not a mocha command");
};

const splitMochaTokens = (tokens) => {
  for (const prefix of mocha_prefix_array) {
    if (isPrefixArray(prefix, tokens)) {
      return {
        before: prefix,
        after: tokens.slice(prefix.length),
      };
    }
  }
  logError("Could not recognize %j as a mocha command", tokens);
  throw new ExternalAppmapError("Not a parsed mocha command");
};

export const doesSupportSource = (source) =>
  mocha_regexp_array.some((regexp) => regexp.test(source));

export const doesSupportTokens = (tokens) =>
  mocha_prefix_array.some((prefix) => isPrefixArray(prefix, tokens));

export const hookCommandSource = (source, shell, base) => {
  const groups = parseMochaSource(source);
  return [
    `${groups.before} --require ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-mocha.mjs", base)),
    )}${groups.after}`,
  ];
};

export const hookCommandTokens = (tokens, base) => {
  const { before, after } = splitMochaTokens(tokens);
  return [
    ...before,
    "--require",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-mocha.mjs", base)),
    ...after,
  ];
};

export const hookEnvironment = (env, base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-loader=${escapeNodeOption(
    convertFileUrlToPath(toAbsoluteUrl("lib/node/loader-standalone.mjs", base)),
  )}`,
});
