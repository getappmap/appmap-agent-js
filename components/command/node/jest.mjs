import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeNodeOption } from "./escape.mjs";
import { sniffTokens, splitTokens } from "./package.mjs";
import { hookJestArgvAsync } from "./jest-argv.mjs";

export const name = "jest";
export const recursive = null;

export const doesSupport = (tokens) => sniffTokens(tokens, "jest");

export const hookCommandAsync = async (tokens, self, base) => {
  const { exec, argv } = splitTokens(tokens);
  return [
    ...exec,
    ...(await hookJestArgvAsync(argv, base)),
    "--setupFilesAfterEnv",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/recorder.mjs", self)),
  ];
};

export const hookEnvironment = (env, self, _base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-vm-modules --experimental-loader=${escapeNodeOption(
    toAbsoluteUrl("lib/node/loader-esm.mjs", self),
  )}`,
});
