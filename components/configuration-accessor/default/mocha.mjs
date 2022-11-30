import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeShell, escapeNodeOption } from "./escape.mjs";
import { generateParseSource, generateSplitTokens } from "./package.mjs";

const { canParseSource, parseSource } = generateParseSource("mocha");
const { canSplitTokens, splitTokens } = generateSplitTokens("mocha");

export const doesSupportSource = canParseSource;

export const doesSupportTokens = canSplitTokens;

export const hookCommandSource = (source, shell, base) => {
  const groups = parseSource(source);
  return [
    `${groups.before} --require ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-mocha.mjs", base)),
    )}${groups.after}`,
  ];
};

export const hookCommandTokens = (tokens, base) => {
  const { before, after } = splitTokens(tokens);
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
