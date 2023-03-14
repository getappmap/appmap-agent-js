import { coalesce } from "../../util/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeNodeOption } from "./escape.mjs";
import { sniffTokens, splitTokens } from "./package.mjs";

export const name = "mocha";
export const recursive = null;

export const doesSupport = (tokens) => sniffTokens(tokens, "mocha");

export const hookCommandAsync = (tokens, self, _base) => {
  const { exec, argv } = splitTokens(tokens);
  return [
    ...exec,
    "--require",
    convertFileUrlToPath(toAbsoluteUrl("lib/node/mocha-hook.mjs", self)),
    ...argv,
  ];
};

export const hookEnvironment = (env, self, _base) => ({
  ...env,
  NODE_OPTIONS: `${coalesce(
    env,
    "NODE_OPTIONS",
    "",
  )} --experimental-loader=${escapeNodeOption(
    toAbsoluteUrl("lib/node/recorder.mjs", self),
  )}`,
});
