import { assert } from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { escapeShell } from "./escape.mjs";

const regexp = /^(?<exec>\s*\S*node(.[a-zA-Z]+)?)(?<argv>($|\s[\s\S]*$))$/u;

const doesSupportSource = (source, _shell) => regexp.test(source);

const doesSupportTokens = (tokens) =>
  tokens.length > 0 && tokens[0].startsWith("node");

const splitNodeCommand = (tokens) => {
  assert(
    !logErrorWhen(
      !doesSupportTokens(tokens),
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

const parseNodeCommand = (source) => {
  const result = regexp.exec(source);
  assert(
    !logErrorWhen(
      result === null,
      "Could not parse %j as a node command",
      source,
    ),
    "Not a node command",
    ExternalAppmapError,
  );
  return result.groups;
};

export const generateNodeRecorder = (recorder) => ({
  doesSupportSource,
  doesSupportTokens,
  recursive: false,
  name: recorder,
  hookCommandSourceAsync: (source, shell, base) => {
    const groups = parseNodeCommand(source);
    return [
      `${groups.exec} --experimental-loader ${escapeShell(
        shell,
        toAbsoluteUrl(`lib/node/recorder.mjs`, base),
      )}${groups.argv}`,
    ];
  },
  hookCommandTokensAsync: (tokens, base) => {
    const { exec, argv } = splitNodeCommand(tokens);
    return [
      ...exec,
      "--experimental-loader",
      toAbsoluteUrl(`lib/node/recorder.mjs`, base),
      ...argv,
    ];
  },
  hookEnvironment: (env, _base) => env,
});
