import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeNodeOption, escapeShell } from "./escape.mjs";
import {
  sniffSource,
  sniffTokens,
  parseSource,
  splitTokens,
} from "./package.mjs";

export const name = "jest";
export const recursive = null;

export const doesSupportSource = (source, shell) =>
  sniffSource(source, "jest", shell);

export const doesSupportTokens = (tokens) => sniffTokens(tokens, "jest");

export const hookCommandSource = (source, shell, base) => {
  const groups = parseSource(source, shell);
  return [
    `${groups.before} --runInBand --setupFilesAfterEnv ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder-jest.mjs", base)),
    )} ${groups.after}`,
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
    toAbsoluteUrl("lib/node/loader-standalone.mjs", base),
  )}`,
});
