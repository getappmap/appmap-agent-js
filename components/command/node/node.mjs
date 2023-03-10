import { assert } from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";

const doesSupport = (tokens) =>
  tokens.length > 0 && tokens[0].startsWith("node");

const splitNodeCommand = (tokens) => {
  assert(
    !logErrorWhen(
      !doesSupport(tokens),
      "Could not recognize %j as a node command",
      tokens,
    ),
    "Not a parsed node command",
    ExternalAppmapError,
  );
  return {
    exec: tokens.slice(0, 1),
    argv: tokens.slice(1),
  };
};

export const generateNodeRecorder = (recorder) => ({
  doesSupport,
  recursive: false,
  name: recorder,
  hookCommandAsync: (tokens, self, _base) => {
    const { exec, argv } = splitNodeCommand(tokens);
    return [
      ...exec,
      "--experimental-loader",
      toAbsoluteUrl(`lib/node/recorder.mjs`, self),
      ...argv,
    ];
  },
  hookEnvironment: (env, _self, _base) => env,
});
