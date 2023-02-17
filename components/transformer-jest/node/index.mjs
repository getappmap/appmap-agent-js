// https://github.com/facebook/jest/blob/ee63afcbe7904d18558d3cc40e0940804df3deb7/packages/jest-transform/src/ScriptTransformer.ts#L261

import { cwd } from "node:process";
import { createRequire } from "node:module";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
// TODO: Make a stateless agent.
// - counter to index references
// - counter to index events

import { openAgent, instrument } from "../../agent/index.mjs";

const {
  RegExp,
  Object: { entries: toEntries },
} = globalThis;

const require = createRequire(toDirectoryUrl(convertPathToFileUrl(cwd())));

const loadTransformer = (specifier, options) => {
  let transformer = require(specifier);
  // This `default` indirection is not documented.
  // But some module bundlers (eg typescript)
  // wrap module exports in `default`.
  if (
    hasOwnProperty(transformer, "default") &&
    typeof transformer.default === "object" &&
    transformer.default !== null
  ) {
    transformer = transformer.default;
  }
  if (
    hasOwnProperty(transformer, "createTransformer") &&
    typeof transformer.createTransformer === "function"
  ) {
    transformer = transformer.createTransformer(options);
  }
  return transformer;
};

const loadDispatchingEntry = ([pattern, { specifier, options }]) => [
  new RegExp(pattern, "u"),
  {
    specifier,
    transformer: loadTransformer(specifier, options),
  },
];

const sanitizeSource = ({ code = null, map = null }, specifier) => {
  assert(
    !logErrorWhen(
      typeof code !== "string",
      "Transformer at %j should return an object whose code property is a string, got: %o",
      specifier,
      code,
    ),
    "Transformer should return an object whose code property is a string",
    ExternalAppmapError,
  );
  return { code, map };
};

const transform = (
  agent,
  source,
  path,
  { supportsStaticESM: is_module },
  { hooks: { esm, cjs } },
) => {
  // Unfortunately, Jest does not provide definitive information
  // on the type of script that is being given.
  // Hence we mirror its strategy which is a simple path extension check.
  // https://github.com/facebook/jest/blob/836157f4807893bb23a4758a60998fbd61cb184c/packages/jest-runtime/src/index.ts#L1176
  if (path.endsWith(".json")) {
    return source;
  } else if (is_module ? esm : cjs) {
    const url = convertPathToFileUrl(path);
    return {
      code: instrument(
        agent,
        { url, type: is_module ? "module" : "script", content: source.code },
        source.map === null ? null : { url, content: source.map },
      ),
      map: null,
    };
  } else {
    return source;
  }
};

export const compileCreateTransformer = (configuration) => {
  const agent = openAgent(configuration);
  return (dispatching) => {
    const transformers = toEntries(dispatching).map(loadDispatchingEntry);
    return {
      canInstrument: false,
      process: (content, path, options) => {
        let source = { code: content, map: null };
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            assert(
              !logErrorWhen(
                !hasOwnProperty(transformer, "process"),
                "Transformer at %j should export `process`",
                specifier,
              ),
              "Transformer should export process",
              ExternalAppmapError,
            );
            source = sanitizeSource(
              transformer.process(content, path, options),
            );
            break;
          }
        }
        return transform(agent, source, path, options, configuration);
      },
      processAsync: async (content, path, options) => {
        let source = { code: content, map: null };
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            assert(
              !logErrorWhen(
                !hasOwnProperty(transformer, "process"),
                "Transformer at %j should export either `process` or `processAsync`",
                specifier,
              ),
              "Transformer should export either process or processAsync",
              ExternalAppmapError,
            );
            source = sanitizeSource(
              await transformer[
                hasOwnProperty(transformer, "processAsync")
                  ? "processAsync"
                  : "process"
              ](content, path, options),
            );
            break;
          }
        }
        return transform(agent, source, path, options, configuration);
      },
    };
  };
};
