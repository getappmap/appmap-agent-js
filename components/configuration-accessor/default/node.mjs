import { assert } from "../../util/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { escapeShell } from "./escape.mjs";

const regexp = /^(?<before>\s*\S*node(.[a-zA-Z]+)?)(?<after>($|\s[\s\S]*$))$/u;

const doesSupportSource = (command) => regexp.test(command);

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
    before: tokens.slice(0, 1),
    after: tokens.slice(1),
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
  hookCommandSource: (source, shell, base) => {
    const groups = parseNodeCommand(source);
    return [
      `${groups.before} --experimental-loader ${escapeShell(
        shell,
        toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
      )}${groups.after}`,
    ];
  },
  hookCommandTokens: (tokens, base) => {
    const { before, after } = splitNodeCommand(tokens);
    return [
      ...before,
      "--experimental-loader",
      toAbsoluteUrl(`lib/node/recorder-${recorder}.mjs`, base),
      ...after,
    ];
  },
  hookEnvironment: (env, _base) => env,
});
