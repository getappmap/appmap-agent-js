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

export const hookCommandSourceAsync = async (source, shell, base) => {
  const groups = parseSource(source, shell);
  return [
    `${groups.exec} --runInBand --setupFilesAfterEnv ${escapeShell(
      shell,
      convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder.mjs", base)),
    )} ${groups.argv}`,
  ];
};

export const hookCommandTokensAsync = async (tokens, base) => {
  const { exec, argv } = splitTokens(tokens);
  return [
    ...exec,
    "--runInBand",
    "--setupFilesAfterEnv",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder.mjs", base)),
    ...argv,
  ];
};

export const hookEnvironment = (env, base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-vm-modules --experimental-loader=${escapeNodeOption(
    toAbsoluteUrl("lib/node/loader-esm.mjs", base),
  )}`,
});
