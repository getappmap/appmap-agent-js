import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeNodeOption, escapeShell } from "./escape.mjs";
import { generateParseSource, generateSplitTokens } from "./package.mjs";

const { canParseSource, parseSource } = generateParseSource("jest");
const { canSplitTokens, splitTokens } = generateSplitTokens("jest");

export const name = "jest";
export const recursive = null;

export const doesSupportSource = canParseSource;
export const doesSupportTokens = canSplitTokens;

export const hookCommandSource = (source, shell, base) => {
  const groups = parseSource(source);
  return [
    `${groups.before} --runInBand --setupFilesAfterEnv ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-jest.mjs", base)),
    )}${groups.after}`,
  ];
};

export const hookCommandTokens = (tokens, base) => {
  const { before, after } = splitTokens(tokens);
  return [
    ...before,
    "--runInBand",
    "--setupFilesAfterEnv",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-jest.mjs", base)),
    ...after,
  ];
};

export const hookEnvironment = (env, base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-vm-modules --experimental-loader=${escapeNodeOption(
    convertFileUrlToPath(toAbsoluteUrl("lib/node/loader-standalone.mjs", base)),
  )}`,
});
