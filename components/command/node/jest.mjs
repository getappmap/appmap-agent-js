import { cwd } from "node:process";
import { coalesce } from "../../util/index.mjs";
import {
  convertFileUrlToPath,
  convertPathToFileUrl,
} from "../../path/index.mjs";
import { toAbsoluteUrl, toDirectoryUrl } from "../../url/index.mjs";
import { escapeNodeOption } from "./escape.mjs";
import { sniffTokens, splitTokens } from "./package.mjs";
import { hookJestArgvAsync } from "./jest-argv.mjs";

export const name = "jest";
export const recursive = null;

export const doesSupport = (tokens) => sniffTokens(tokens, "jest");

export const hookCommandAsync = async (tokens, base) => {
  const { exec, argv } = splitTokens(tokens);
  return [
    ...exec,
    "--runInBand",
    ...(await hookJestArgvAsync(
      argv,
      toDirectoryUrl(convertPathToFileUrl(cwd())),
    )),
    "--setupFilesAfterEnv",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder.mjs", base)),
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
