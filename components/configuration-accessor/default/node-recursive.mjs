import { constant, coalesce } from "../../util/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { convertFileUrlToPath } from "../../path/index.mjs";
import { escapeNodeOption } from "./escape.mjs";

export const doesSupportSource = constant(true);

export const doesSupportTokens = constant(true);

export const generateNodeHook = (recorder) => ({
  hookCommandSource: (source, _shell, _base) => [source],
  hookCommandTokens: (tokens, _base) => tokens,
  hookEnvironment: (env, base) => ({
    ...env,
    NODE_OPTIONS: `${coalesce(
      env,
      "NODE_OPTIONS",
      "",
    )} --experimental-loader=${escapeNodeOption(
      convertFileUrlToPath(
        toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
      ),
    )}`,
  }),
});
