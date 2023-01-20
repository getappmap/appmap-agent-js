import { constant, coalesce } from "../../util/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { escapeNodeOption } from "./escape.mjs";

const doesSupport = constant(true);

export const generateNodeRecorder = (recorder) => ({
  name: recorder,
  recursive: true,
  doesSupport,
  hookCommandAsync: (tokens, _base) => tokens,
  hookEnvironment: (env, base) => ({
    ...env,
    NODE_OPTIONS: `${coalesce(
      env,
      "NODE_OPTIONS",
      "",
    )} --experimental-loader=${escapeNodeOption(
      toAbsoluteUrl(`lib/node/recorder.mjs`, base),
    )}`,
  }),
});
